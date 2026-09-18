// Automatic choices are recorded as automatic, never as owner approvals.
export async function preparePlaylist(plan, {search, saveCanonical, sync, save}) {
  const selected=plan.songs.filter(s=>s.inPlaylist!==false);
  const setState=async(state,message)=>{plan.automation={state,message,checkedAt:new Date().toISOString()};await save(plan);return plan;};
  if(selected.length<3||selected.length>5)return setState('needs-review','Choose 3–5 songs for automatic playlist creation.');
  const unresolved=[];
  for(const song of selected){
    const referenceIds=[...new Set((song.attachments||[]).map(a=>a.youtubeId).filter(Boolean))].sort();
    if(song.canonical?.videoId&&(song.canonical.selection==='owner'||JSON.stringify(song.canonical.referenceIds||[])===JSON.stringify(referenceIds)))continue;
    const candidates=await search(song);
    const match=candidates.find(v=>v.eligible===true);
    if(!match){unresolved.push(song.title);continue;}
    const canonical={videoId:match.videoId,title:match.title,channel:match.channel,selection:'automatic',referenceIds,selectedAt:new Date().toISOString()};
    await saveCanonical(song.songId,canonical);song.canonical=canonical;plan.playlistDirty=true;
  }
  if(unresolved.length)return setState('needs-review',`No suitable live recording found for: ${unresolved.join(', ')}. The playlist will update after these choices are saved.`);
  if(plan.playlistId&&!plan.playlistDirty)return setState('ready','Your YouTube playlist is up to date.');
  plan.playlistId=await sync(plan);plan.playlistDirty=false;
  return setState('ready','Your YouTube playlist is ready. Future set changes update automatically.');
}
