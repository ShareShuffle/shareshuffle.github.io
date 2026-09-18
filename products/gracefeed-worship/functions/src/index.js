import express from 'express';
import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,Timestamp} from 'firebase-admin/firestore';
import {onRequest} from 'firebase-functions/v2/https';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {SecretManagerServiceClient} from '@google-cloud/secret-manager';
import {digest,token,fail,id,publicPlan,serviceDate,isInvitedSchedule,VIDEO_POLICY} from './domain.js';
import {planningCenter} from './pco.js';
import {oauthClient,youtube} from './youtube.js';
import {worshipStore} from './store.js';
import {preparePlaylist} from './automation.js';
initializeApp();const db=worshipStore(getFirestore());const sm=new SecretManagerServiceClient();
const project=process.env.GCLOUD_PROJECT||process.env.GOOGLE_CLOUD_PROJECT;
const settingsRef=db.doc('worship/settings');
const planRef=pid=>db.doc(`plans/${id(pid)}`);
async function secret(name,optional=false){try{const [v]=await sm.accessSecretVersion({name:`projects/${project}/secrets/WORSHIP_${name}/versions/latest`});return v.payload.data.toString();}catch(e){if(optional&&e.code===5)return '';throw fail(503,`Connection setup needed: ${name}.`);}}
async function config(){const s=(await settingsRef.get()).data()||{};return {...s,ownerUid:process.env.OWNER_UID,origin:process.env.APP_ORIGIN||'https://worship.gracefeed.com',clientId:process.env.GOOGLE_CLIENT_ID,channelId:s.channelId||process.env.YOUTUBE_CHANNEL_ID,serviceTypeId:s.serviceTypeId||process.env.PCO_SERVICE_TYPE_ID,personId:s.personId||process.env.PCO_PERSON_ID,stevenId:process.env.PCO_STEVEN_PERSON_ID,timezone:process.env.SERVICE_TIMEZONE||'America/Chicago',shareFiles:process.env.SHARE_ATTACHMENTS==='true',slackEnabled:process.env.SLACK_ENABLED==='true',autoPlaylist:process.env.AUTO_PLAYLIST!=='false'};}
async function pco(){return planningCenter(await secret('PCO_APP_ID'),await secret('PCO_SECRET'));}
async function yt(){const c=await config();const client=oauthClient(c,await secret('GOOGLE_CLIENT_SECRET'));client.setCredentials({refresh_token:await secret('YOUTUBE_REFRESH_TOKEN')});return youtube(client);}
async function lock(work){const ref=db.doc('locks/worship');const owner=token();await db.runTransaction(async tx=>{const s=(await tx.get(ref)).data();if(s?.expiresAt>Date.now())throw fail(409,'Another update is running. Try again in a moment.');tx.set(ref,{owner,expiresAt:Date.now()+600000});});try{return await work();}finally{await db.runTransaction(async tx=>{if((await tx.get(ref)).data()?.owner===owner)tx.delete(ref);});}}
async function saveFresh(api,c,planId){const next=await api.nextPlan(c,planId);const old=(await planRef(next.id).get()).data();
  for(const s of next.songs){const saved=(await db.doc(`canonical/${id(s.songId)}`).get()).data();s.canonical=saved||null;s.artist=(await db.doc(`songMetadata/${id(s.songId)}`).get()).data()?.artist||s.artist;const before=old?.songs.find(x=>x.id===s.id);if(before)s.inPlaylist=before.inPlaylist;}
  next.playlistId=old?.playlistId||null;
  const signature=p=>JSON.stringify(p?.songs.map(s=>[s.songId,s.canonical?.videoId||null,s.inPlaylist])||[]);
  next.playlistDirty=!!old?.playlistDirty || old?.date!==next.date || signature(old)!==signature(next);
  await planRef(next.id).set(next);await automaticPlaylist(next,c);return next;
}
async function automaticPlaylist(plan,c){
  if(!c.autoPlaylist)return;
  if(!c.youtubeConnected){plan.automation={state:'connect-youtube',message:'Connect @richwilliamsgo once to enable automatic playlists.'};await planRef(plan.id).set(plan);return;}
  try{const client=await yt();await client.verifyChannel(c.channelId);
    await preparePlaylist(plan,{
      search:async song=>{const ref=db.doc(`alternatives/${id(song.songId)}`);let saved=(await ref.get()).data();if(!saved||saved.policy!==VIDEO_POLICY||saved.context!==JSON.stringify([song.artist,song.writers,song.attachments?.map(a=>a.youtubeId)])||saved.at<Date.now()-86400000){saved={policy:VIDEO_POLICY,context:JSON.stringify([song.artist,song.writers,song.attachments?.map(a=>a.youtubeId)]),at:Date.now(),choices:await client.alternatives(song)};await ref.set(saved);}return saved.choices;},
      saveCanonical:(sid,canonical)=>db.doc(`canonical/${id(sid)}`).set(canonical),
      sync:p=>client.sync(p,playlistId=>planRef(p.id).update({playlistId,playlistDirty:true})),
      save:p=>planRef(p.id).set(p)
    });
  }catch{const saved=(await planRef(plan.id).get()).data();plan.playlistId=saved?.playlistId||plan.playlistId||null;plan.playlistDirty=true;plan.automation={state:'retry',message:'YouTube could not update. The next check will retry; if this continues, reconnect YouTube.'};await planRef(plan.id).set(plan);}
}
async function refresh(force=false){return lock(async()=>{const c=await config();if(!force&&c.lastRefresh>Date.now()-120000)return;const api=await pco();let plans=[];
  if(c.personId){const schedules=await api.list(`/services/v2/people/${id(c.personId)}/schedules?per_page=100`);const today=serviceDate(new Date().toISOString(),c.timezone);const seen=new Set();
    for(const s of schedules.data){const rel=s.relationships||{};const pid=rel.plan?.data?.id;const pp=rel.plan_person?.data?.id;
      if(!pid||!pp||seen.has(pid)||rel.service_type?.data?.id!==c.serviceTypeId||!s.attributes.plan_visible_to_me||serviceDate(s.attributes.sort_date,c.timezone)<today||['D','Declined'].includes(s.attributes.status))continue;
      const invitation=(await api.api(`/services/v2/people/${id(c.personId)}/plan_people/${id(pp)}`)).data;
      if(!isInvitedSchedule(s,invitation,c.serviceTypeId,today,c.timezone))continue;
      seen.add(pid);plans.push({id:pid,date:s.attributes.sort_date});
    }
    plans.sort((a,b)=>new Date(a.date)-new Date(b.date));
    for(const p of plans.slice(0,12))await saveFresh(api,c,p.id);
    await settingsRef.set({currentPlanId:plans.length?`${c.serviceTypeId}-${plans[0].id}`:null,lastRefresh:Date.now(),lastSyncError:null},{merge:true});
  }else{const next=await saveFresh(api,c);await settingsRef.set({currentPlanId:next.id,lastRefresh:Date.now(),lastSyncError:null},{merge:true});}
});}
async function getPlan(pid){const p=(await planRef(pid).get()).data();if(!p)throw fail(404,'This service is not available.');return p;}
const app=express();app.disable('x-powered-by');app.use(express.json({limit:'16kb'}));
app.use((req,res,next)=>{res.set({'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});next();});
app.get('/api/health',(_req,res)=>res.json({ok:true,app:'gracefeed-worship'}));
app.get('/api/oauth/callback',async(req,res)=>{
  const state=String(req.query.state||'');const cookie=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('__session='))?.slice(10);
  if(!state||cookie!==state)throw fail(403,'YouTube connection expired. Start again from Connections.');
  const ref=db.doc(`oauthStates/${digest(state)}`);const c=await config();
  await db.runTransaction(async tx=>{const s=(await tx.get(ref)).data();if(!s||s.uid!==c.ownerUid||s.expiresAt.toMillis()<Date.now())throw fail(403,'YouTube connection expired.');tx.delete(ref);});
  res.clearCookie('__session',{secure:true,httpOnly:true,sameSite:'lax',path:'/'});
  if(req.query.error)return res.redirect(`${c.origin}/?connection=cancelled`);
  const client=oauthClient(c,await secret('GOOGLE_CLIENT_SECRET'));const {tokens}=await client.getToken(String(req.query.code||''));client.setCredentials(tokens);const connectedChannel=await youtube(client).verifyChannel(c.channelId,true);
  if(!tokens.refresh_token)throw fail(422,'Google did not provide offline access. Reconnect with consent.');
  await sm.addSecretVersion({parent:`projects/${project}/secrets/WORSHIP_YOUTUBE_REFRESH_TOKEN`,payload:{data:Buffer.from(tokens.refresh_token)}});
  await settingsRef.set({youtubeConnected:true,channelId:connectedChannel.id,lastRefresh:0},{merge:true});res.redirect(`${c.origin}/?connection=connected`);
});
app.use('/api',async(req,res,next)=>{
  if(!['GET','HEAD'].includes(req.method)){const c=await config();const allowedOrigins=new Set([c.origin,'https://gracefeed-worship.web.app']);if(!allowedOrigins.has(req.headers.origin))throw fail(403,'This request must come from the Worship app.');}
  if(req.path.startsWith('/shared'))return next();
  const bearer=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];if(!bearer)throw fail(401,'Sign in to manage Worship.');
  let user;try{user=await getAuth().verifyIdToken(bearer,true);}catch{throw fail(401,'Please sign in again.');}
  const c=await config();if(!c.ownerUid||user.uid!==c.ownerUid)throw fail(403,'This account cannot manage Worship. Use a bandmate share link for read-only access.');req.user=user;next();
});
app.get('/api/status',async(_req,res)=>{const c=await config();res.json({serviceTypeId:c.serviceTypeId||'',personId:c.personId||'',youtubeConnected:!!c.youtubeConnected,invitationSync:!!c.personId,lastRefresh:c.lastRefresh||null,lastSyncError:c.lastSyncError||null,shareFiles:c.shareFiles,slackEnabled:c.slackEnabled,autoPlaylist:c.autoPlaylist});});
app.get('/api/plans',async(_req,res)=>{const c=await config();const all=await db.collection('plans').orderBy('date','desc').limit(30).get();res.json({currentPlanId:c.currentPlanId||null,plans:all.docs.map(d=>({id:d.id,date:d.data().date,title:d.data().title}))});});
app.get('/api/plans/:pid',async(req,res)=>res.json(publicPlan(await getPlan(req.params.pid),true)));
app.post('/api/refresh',async(_req,res)=>{await refresh();const c=await config();res.json({plan:c.currentPlanId?publicPlan(await getPlan(c.currentPlanId),true):null});});
app.get('/api/pco/service-types',async(_req,res)=>{const a=await pco();const data=await a.list('/services/v2/service_types?per_page=100');res.json(data.data.map(x=>({id:x.id,name:x.attributes.name})));});
app.post('/api/settings',async(req,res)=>{const serviceTypeId=id(req.body.serviceTypeId);const personId=req.body.personId?id(req.body.personId):null;const api=await pco();await api.api(`/services/v2/service_types/${serviceTypeId}`);if(personId)await api.api(`/services/v2/people/${personId}`);await lock(()=>settingsRef.set({serviceTypeId,personId,lastRefresh:0},{merge:true}));res.json({ok:true});});
app.post('/api/oauth/start',async(req,res)=>{const c=await config();if(!c.clientId)throw fail(422,'Set up the Google OAuth client first.');const client=oauthClient(c,await secret('GOOGLE_CLIENT_SECRET'));const state=token();await db.doc(`oauthStates/${digest(state)}`).set({uid:req.user.uid,expiresAt:Timestamp.fromMillis(Date.now()+600000)});res.cookie('__session',state,{httpOnly:true,secure:true,sameSite:'lax',maxAge:600000,path:'/'});res.json({url:client.generateAuthUrl({access_type:'offline',prompt:'consent',scope:['https://www.googleapis.com/auth/youtube.force-ssl'],state})});});
app.post('/api/plans/:pid/songs/:sid/artist',async(req,res)=>{const artist=typeof req.body.artist==='string'?req.body.artist.trim():'';if(artist.length>200)throw fail(400,'Artist name is too long.');await lock(async()=>{const p=await getPlan(req.params.pid);const s=p.songs.find(x=>x.id===req.params.sid);if(!s)throw fail(404,'Song not found.');await db.doc(`songMetadata/${id(s.songId)}`).set({artist});s.artist=artist;await planRef(p.id).set(p);await db.doc(`alternatives/${id(s.songId)}`).delete();});res.json({ok:true});});
app.post('/api/plans/:pid/songs/:sid/alternatives',async(req,res)=>{const p=await getPlan(req.params.pid);const s=p.songs.find(x=>x.id===req.params.sid);if(!s)throw fail(404,'Song not found.');const ref=db.doc(`alternatives/${id(s.songId)}`);let saved=(await ref.get()).data();if(!saved||saved.policy!==VIDEO_POLICY||saved.at<Date.now()-86400000){const choices=await(await yt()).alternatives(s);saved={policy:VIDEO_POLICY,at:Date.now(),choices};await ref.set(saved);}res.json(saved.choices);});
app.post('/api/plans/:pid/songs/:sid/version',async(req,res)=>{await lock(async()=>{const p=await getPlan(req.params.pid);const s=p.songs.find(x=>x.id===req.params.sid);if(!s)throw fail(404,'Song not found.');const choices=(await db.doc(`alternatives/${id(s.songId)}`).get()).data()?.choices||[];const choice=choices.find(x=>x.videoId===req.body.videoId);if(!choice)throw fail(422,'Choose a version from the current alternatives.');const canonical={videoId:choice.videoId,title:choice.title,channel:choice.channel,selection:'owner',approvedAt:new Date().toISOString()};await db.doc(`canonical/${id(s.songId)}`).set(canonical);s.canonical=canonical;p.playlistDirty=true;await planRef(p.id).set(p);});res.json({ok:true});});
app.post('/api/plans/:pid/songs/:sid/include',async(req,res)=>{await lock(async()=>{const p=await getPlan(req.params.pid);const s=p.songs.find(x=>x.id===req.params.sid);if(!s)throw fail(404,'Song not found.');s.inPlaylist=req.body.include===true;p.playlistDirty=true;await planRef(p.id).set(p);});res.json({ok:true});});
app.post('/api/plans/:pid/playlist',async(req,res)=>{const playlistId=await lock(async()=>{const p=await getPlan(req.params.pid);const client=await yt();await client.verifyChannel((await config()).channelId);const result=await client.sync(p,playlistId=>planRef(p.id).update({playlistId,playlistDirty:true}));await planRef(p.id).update({playlistId:result,playlistDirty:false});return result;});res.json({playlistId});});
app.post('/api/shares',async(req,res)=>{const scope=req.body.scope==='band'?'band':'service';const pid=scope==='service'?id(req.body.planId):null;if(pid)await getPlan(pid);const raw=token();const ref=db.collection('shares').doc();await ref.set({hash:digest(raw),scope,planId:pid,createdAt:Date.now(),revoked:false});const c=await config();res.json({id:ref.id,url:`${c.origin}/${scope==='band'?'band':'service'}/${ref.id}#${raw}`});});
app.post('/api/notify-slack',async(req,res)=>{const c=await config();if(!c.slackEnabled)throw fail(422,'Slack notifications are not configured.');let url;try{url=new URL(req.body.url);}catch{throw fail(400,'Create a band or service link first.');}const m=url.pathname.match(/^\/(band|service)\/([a-zA-Z0-9_-]+)$/);if(url.origin!==c.origin||!m)throw fail(400,'Use a share link from this app.');const share=(await db.doc(`shares/${id(m[2])}`).get()).data();if(!share||share.revoked||digest(url.hash.slice(1))!==share.hash)throw fail(403,'This share link is unavailable.');const webhook=await secret('SLACK_WEBHOOK_URL');const destination=new URL(webhook);if(destination.origin!=='https://hooks.slack.com')throw fail(422,'Configure a Slack incoming webhook.');const result=await fetch(destination,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'FBCP rehearsal set is ready.',blocks:[{type:'section',text:{type:'plain_text',text:'FBCP rehearsal set is ready. Open the shared songs, audio, charts, and playlist.'}},{type:'actions',elements:[{type:'button',text:{type:'plain_text',text:'Open rehearsal set'},url:url.href}]}]}),redirect:'error',signal:AbortSignal.timeout(15000)});if(!result.ok)throw fail(502,'Slack could not receive the notification.');res.json({ok:true});});
app.get('/api/shares',async(_req,res)=>{const docs=await db.collection('shares').get();res.json(docs.docs.map(d=>({id:d.id,scope:d.data().scope,planId:d.data().planId,revoked:d.data().revoked})));});
app.delete('/api/shares/:shareId',async(req,res)=>{await db.doc(`shares/${id(req.params.shareId)}`).update({revoked:true});res.json({ok:true});});
async function shared(req){const share=(await db.doc(`shares/${id(req.params.shareId)}`).get()).data();const key=req.headers.authorization?.match(/^Share ([a-zA-Z0-9_-]{43})$/)?.[1];if(!key||!share||share.revoked||digest(key)!==share.hash)throw fail(404,'This link is unavailable or has been revoked.');const c=await config();const pid=share.scope==='band'?c.currentPlanId:share.planId;return {c,plan:pid?await getPlan(pid):null};}
app.get('/api/shared/:shareId',async(req,res)=>{const {c,plan}=await shared(req);res.json(publicPlan(plan,c.shareFiles));});
app.post('/api/shared/:shareId/refresh',async(req,res)=>{await shared(req);try{await refresh();}catch(e){if(e.status!==409)throw e;}const {c,plan}=await shared(req);res.json(publicPlan(plan,c.shareFiles));});
async function attachmentLink(p,sid,aid){const song=p.songs.find(s=>s.id===sid);const a=song?.attachments.find(a=>a.id===aid);if(!a||!a.downloadable)throw fail(403,'Open this attachment in Planning Center.');const api=await pco();const result=await api.api(`${a.resource}/open`,'POST');const url=result.data?.attributes?.attachment_url;let parsed;try{parsed=new URL(url);}catch{throw fail(502,'Planning Center did not return a file link.');}if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw fail(502,'Invalid attachment link.');return {url:parsed.href};}
app.post('/api/plans/:pid/songs/:sid/attachments/:aid',async(req,res)=>res.json(await attachmentLink(await getPlan(req.params.pid),req.params.sid,req.params.aid)));
app.post('/api/shared/:shareId/songs/:sid/attachments/:aid',async(req,res)=>{const {c,plan}=await shared(req);if(!c.shareFiles||!plan)throw fail(403,'Use your Planning Center login for files.');res.json(await attachmentLink(plan,req.params.sid,req.params.aid));});
app.use((err,_req,res,_next)=>{const status=err.status||500;if(status>=500)console.error('Worship request failed',{status,code:err.code||'unknown'});res.status(status).json({error:status===500?'The request could not finish. Please try again.':err.message});});
export const worshipApi=onRequest({region:'us-central1',timeoutSeconds:540,memory:'512MiB',maxInstances:3},app);
export const syncInvitations=onSchedule({schedule:'every 15 minutes',region:'us-central1',timeoutSeconds:540,memory:'512MiB',maxInstances:1},async()=>{const c=await config();if(!c.serviceTypeId||!c.personId)return;try{await refresh();}catch(e){await settingsRef.set({lastSyncError:'The scheduled check could not finish. Open Worship and refresh to retry.'},{merge:true});throw new Error('Invitation sync failed');}});
