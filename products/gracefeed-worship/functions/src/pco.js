import {attachmentInfo, fail, serviceDate} from './domain.js';
const BASE='https://api.planningcenteronline.com';
export function planningCenter(appId, secret, request=fetch) {
  async function api(path, method='GET') {
    const url=new URL(path,BASE);
    if(url.origin!==BASE || !url.pathname.startsWith('/services/v2/')) throw fail(502,'Unexpected Planning Center endpoint.');
    const r=await request(url,{method,headers:{Authorization:`Basic ${Buffer.from(`${appId}:${secret}`).toString('base64')}`,'User-Agent':'Gracefeed-Worship/1.0','X-PCO-API-Version':'2018-11-01'},signal:AbortSignal.timeout(25000),redirect:'error'});
    if(!r.ok) throw fail(r.status===401||r.status===403?422:502,`Planning Center could not complete the request (${r.status}). Check access and try again.`);
    return r.json();
  }
  async function list(path) {
    const data=[]; const included=[]; let next=path;
    for(let page=0;next && page<50;page++) {const r=await api(next);data.push(...r.data);included.push(...r.included||[]);next=r.links?.next;}
    if(next) throw fail(502,'Planning Center returned too many pages. Narrow the service selection.');
    return {data,included};
  }
  async function nextPlan(config, planId) {
    if(!config.serviceTypeId) throw fail(422,'Select the FBCP service type in Connections first.');
    const base=`/services/v2/service_types/${config.serviceTypeId}/plans`;
    const plans=await api(planId ? `${base}/${planId}` : `${base}?filter=future&order=sort_date&per_page=1`);
    const p=planId ? plans.data : plans.data[0]; if(!p) throw fail(404,'No upcoming plan is available in this service type.');
    const date=serviceDate(p.attributes.sort_date,config.timezone);
    const items=await list(`${base}/${p.id}/items?include=song,arrangement,key&per_page=100`);
    let roster=[];
    try {
      const members=await list(`${base}/${p.id}/team_members?filter=not_declined&per_page=100`);
      roster=members.data.map(member=>({
        id:member.id,
        name:(member.attributes?.name||'').trim(),
        position:(member.attributes?.team_position_name||'Team').trim()
      })).filter(member=>member.name);
    } catch {
      // Keep the set available even when this Planning Center token cannot read team members.
    }
    const included=new Map(items.included.map(x=>[`${x.type}:${x.id}`,x]));
    const songs=[]; const warnings=[];
    for(const item of items.data.filter(x=>x.attributes.item_type==='song').sort((a,b)=>a.attributes.sequence-b.attributes.sequence)) {
      const rel=item.relationships||{}; const sid=rel.song?.data?.id; if(!sid)continue;
      const aid=rel.arrangement?.data?.id;const kid=rel.key?.data?.id;
      const song=included.get(`Song:${sid}`)?.attributes||{};const arrangement=included.get(`Arrangement:${aid}`)?.attributes||{};
      const roots=[{path:`${base}/${p.id}/items/${item.id}/attachments`,scope:'item'}];
      if(aid) roots.push({path:`/services/v2/songs/${sid}/arrangements/${aid}/attachments`,scope:'arrangement'});
      if(aid&&kid)roots.push({path:`/services/v2/songs/${sid}/arrangements/${aid}/keys/${kid}/attachments`,scope:`key:${kid}`});
      const attachments=new Map();
      for(const root of roots) {
        try {const result=await list(`${root.path}?per_page=100`);for(const a of result.data){const info=attachmentInfo(a,root.scope,kid,config.stevenId);info.resource ||= `${root.path}/${a.id}`;attachments.set(a.id,info);}}
        catch {warnings.push(`Some attachments for ${item.attributes.title} could not be loaded. Open Planning Center to check.`);}
      }
      if(arrangement.has_chord_chart)attachments.set(`chart-${aid}`,{id:`chart-${aid}`,name:'Planning Center chord chart',kind:'chart',keyMatched:false,steven:false,downloadable:false,resource:null});
      songs.push({id:item.id,songId:sid,title:item.attributes.title||song.title||'Untitled song',artist:'',writers:song.author||'',key:item.attributes.key_name||included.get(`Key:${kid}`)?.attributes.name||'Not selected',arrangement:arrangement.name||'Not selected',attachments:[...attachments.values()].sort((a,b)=>(Number(b.steven&&b.keyMatched)-Number(a.steven&&a.keyMatched))),inPlaylist:songs.length<5,canonical:null});
    }
    return {id:`${config.serviceTypeId}-${p.id}`,date,title:p.attributes.title||'Sunday worship',pcoUrl:`https://services.planningcenteronline.com/plans/${p.id}`,roster,songs,warnings,updatedAt:new Date().toISOString(),playlistId:null,playlistDirty:true};
  }
  return {api,list,nextPlan};
}
