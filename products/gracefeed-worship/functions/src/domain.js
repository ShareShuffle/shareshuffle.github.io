import { createHash, randomBytes } from 'node:crypto';
export const digest = value => createHash('sha256').update(value).digest('hex');
export const token = () => randomBytes(32).toString('base64url');
export const fail = (status, message) => Object.assign(new Error(message), {status});
export const id = value => { if (!/^[a-zA-Z0-9_-]{1,120}$/.test(value || '')) throw fail(400,'Invalid identifier.'); return value; };
export function serviceDate(value, zone = 'America/Chicago') {
  if (!value || !Number.isFinite(new Date(value).getTime())) throw fail(422,'The plan needs a dated service time.');
  return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
}
const normalize = value => (value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
export const VIDEO_POLICY = 'plan-writers-bethel-hillsong-live-v3';
export const songIdentities = song => [...new Set([song.artist, ...(song.writers || '').split(/[,;&]|\band\b/i)].map(x=>(x||'').trim()).filter(x=>x.length>3))];
export function rankVideos(song, items) {
  return items.map(v => {
    const title=normalize(v.title), channel=normalize(v.channel);
    const identity=songIdentities(song).map(normalize).some(x=>channel.includes(x)||(title.includes(x)&&! /\bcover\b/.test(title)));
    const live=/\blive\b|passion conference|worship night|red rocks|wembley/.test(title)||/recorded live|filmed live|live recording|live performance/i.test(v.description||'');
    const excluded=/\blyrics?\b|\bstudio\b|\btutorial\b|visuali[sz]er|\bkaraoke\b|\binstrumental\b|\breaction\b/.test(title);
    const words=normalize(song.title).split(' ').filter(w=>w.length>2);
    const matches=words.length>0&&words.every(w=>title.split(' ').includes(w));
    const tier=v.planLinked?4:identity?3:/\bbethel\b/.test(title+' '+channel)?2:/\bhillsong\b/.test(title+' '+channel)?1:0;
    // Popularity dominates within a tier; older uploads receive a bounded bonus.
    const age=Number.isFinite(Date.parse(v.publishedAt))?Math.max(0,(Date.now()-Date.parse(v.publishedAt))/(365.25*86400000)):0;
    const popularity=Math.min(80,Math.log10(1+Math.max(0,Number(v.viewCount)||0))*8)+Math.min(15,age);
    return {...v,tier,score:tier*100+popularity,eligible:live&&matches&&!excluded,reason:['Live performance · views and upload age','Hillsong live performance','Bethel live performance','Artist or songwriter match · live performance','Planning Center reference · live performance'][tier]};
  }).filter(v=>v.eligible).sort((a,b)=>b.score-a.score||Date.parse(a.publishedAt||'9999')-Date.parse(b.publishedAt||'9999')).slice(0,5);
}
export function youtubeVideoId(value){
  try{const u=new URL(value);if(!['https:','http:'].includes(u.protocol))return null;let id=null;
    if(['youtu.be','www.youtu.be'].includes(u.hostname))id=u.pathname.split('/')[1];
    else if(['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname))id=u.searchParams.get('v')||(/^\/(?:embed|live|shorts)\//.test(u.pathname)?u.pathname.split('/')[2]:null);
    return /^[a-zA-Z0-9_-]{11}$/.test(id||'')?id:null;
  }catch{return null;}
}
export function attachmentInfo(a, scope, selectedKeyId, stevenId) {
  const x=a.attributes || {}; const name=x.display_name || x.filename || 'Attachment';
  const audio=/audio|mp3|m4a|wav/i.test(`${x.content_type} ${x.filetype} ${name}`);
  const creator=a.relationships?.created_by?.data?.id;
  const youtubeId=[x.linked_url,x.url,x.remote_link].map(youtubeVideoId).find(Boolean)||null;
  return {id:a.id,name,youtubeId,kind:audio?'audio':'chart',keyMatched:scope === `key:${selectedKeyId}`,steven:!!stevenId && creator===stevenId,downloadable:x.downloadable===true && (!audio || x.allow_mp3_download===true),resource:a.links?.self || null};
}
export function publicPlan(plan, shareFiles=false) {
  if(!plan) return null;
  return {id:plan.id,date:plan.date,title:plan.title,church:'FBCP',pcoUrl:plan.pcoUrl,updatedAt:plan.updatedAt,playlistId:plan.playlistId||null,playlistDirty:!!plan.playlistDirty,warnings:plan.warnings||[],automation:plan.automation?{state:plan.automation.state,message:plan.automation.message}:null,roster:(plan.roster||[]).map(member=>({id:member.id,name:member.name,position:member.position})),songs:plan.songs.map(s=>({id:s.id,songId:s.songId,title:s.title,artist:s.artist,writers:s.writers,key:s.key,arrangement:s.arrangement,inPlaylist:s.inPlaylist,canonical:s.canonical?{videoId:s.canonical.videoId,title:s.canonical.title,channel:s.canonical.channel,selection:s.canonical.selection||'owner'}:null,attachments:s.attachments.map(a=>({id:a.id,name:a.name,kind:a.kind,keyMatched:a.keyMatched,steven:a.steven,available:shareFiles && a.downloadable}))}))};
}
export function playlistVideos(plan) {
  const songs=plan.songs.filter(s=>s.inPlaylist!==false);
  if(songs.length<3 || songs.length>5) throw fail(422,'Choose 3–5 songs for the rehearsal playlist.');
  if(songs.some(s=>!s.canonical?.videoId)) throw fail(422,'Approve a live version for each selected song first.');
  return [...new Set(songs.map(s=>s.canonical.videoId))];
}

export function isInvitedSchedule(schedule, invitation, serviceTypeId, today, timezone) {
  return schedule.relationships?.service_type?.data?.id===serviceTypeId &&
    schedule.attributes.plan_visible_to_me===true &&
    !['D','Declined'].includes(schedule.attributes.status) &&
    serviceDate(schedule.attributes.sort_date,timezone)>=today &&
    !!invitation.attributes.notification_sent_at;
}
