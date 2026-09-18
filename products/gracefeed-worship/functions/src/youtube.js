import {google} from 'googleapis';
import {fail,rankVideos,playlistVideos,songIdentities} from './domain.js';
export function oauthClient(config,secret) {return new google.auth.OAuth2(config.clientId,secret,`${config.origin}/api/oauth/callback`);}
export function youtube(client, providedApi) {
  const api=providedApi || google.youtube({version:'v3',auth:client});
  return {
    async verifyChannel(expectedId, allowFirstConnection=false) {
      if(!expectedId&&!allowFirstConnection) throw fail(422,'Reconnect @richwilliamsgo before publishing.');
      const mine=(await api.channels.list({part:['id','snippet'],mine:true})).data.items||[];
      const expected=(await api.channels.list({part:['id'],forHandle:'@richwilliamsgo'})).data.items||[];
      const resolvedId=expected[0]?.id;
      if(!resolvedId || (expectedId&&resolvedId!==expectedId) || !mine.some(c=>c.id===resolvedId))throw fail(403,'Choose the YouTube account for @richwilliamsgo. This app cannot connect another channel.');
      return mine.find(c=>c.id===resolvedId);
    },
    async alternatives(song) {
      const items=new Map();
      const linked=[...new Set((song.attachments||[]).map(a=>a.youtubeId).filter(Boolean))];
      if(linked.length){
        const r=await api.videos.list({part:['snippet','statistics','status'],id:linked.slice(0,50)});
        const picks=rankVideos(song,(r.data.items||[]).filter(v=>v.status?.privacyStatus==='public'&&v.status?.embeddable!==false&&v.snippet.liveBroadcastContent!=='upcoming').map(v=>({videoId:v.id,title:v.snippet.title,description:v.snippet.description||'',channel:v.snippet.channelTitle,publishedAt:v.snippet.publishedAt,viewCount:Number(v.statistics?.viewCount||0),planLinked:true})));
        if(picks.length)return picks;
      }
      const queries=[...songIdentities(song).slice(0,4),'Bethel','Hillsong',''];
      for(const performer of queries){
        const result=await api.search.list({part:['snippet'],type:['video'],maxResults:15,q:`${song.title} ${performer} live`,videoEmbeddable:'true'});
        for(const x of result.data.items||[])items.set(x.id.videoId,{videoId:x.id.videoId,title:x.snippet.title,channel:x.snippet.channelTitle,publishedAt:x.snippet.publishedAt});
      }
      const ids=[...items.keys()];
      for(let i=0;i<ids.length;i+=50){
        const result=await api.videos.list({part:['statistics','snippet','status'],id:ids.slice(i,i+50)});
        for(const v of result.data.items||[]){const candidate=items.get(v.id);Object.assign(candidate,{description:v.snippet.description||'',title:v.snippet.title,channel:v.snippet.channelTitle,publishedAt:v.snippet.publishedAt,viewCount:Number(v.statistics?.viewCount||0),available:v.status?.privacyStatus==='public'&&v.status?.embeddable!==false&&v.snippet.liveBroadcastContent!=='upcoming'});}
      }
      return rankVideos(song,[...items.values()].filter(v=>v.available));
    },
    async sync(plan, savePlaylistId) {
      const wanted=playlistVideos(plan);let playlistId=plan.playlistId;
      if(!playlistId){const result=await api.playlists.insert({part:['snippet','status'],requestBody:{snippet:{title:`${plan.date}-FBCP`,description:'FBCP rehearsal · selected live performances · Gracefeed Worship'},status:{privacyStatus:'unlisted'}}});playlistId=result.data.id;await savePlaylistId(playlistId);}
      const existing=[]; let pageToken;
      do {const r=await api.playlistItems.list({part:['snippet'],playlistId,maxResults:50,pageToken});existing.push(...r.data.items||[]);pageToken=r.data.nextPageToken;}while(pageToken);
      // Reconcile in place: rerunning after partial failure converges without duplicating songs.
      const retained=new Map();
      for(const item of existing){const vid=item.snippet.resourceId.videoId;if(!wanted.includes(vid)||retained.has(vid))await api.playlistItems.delete({id:item.id});else retained.set(vid,item);}
      for(const [position,vid] of wanted.entries()){
        const snippet={playlistId,position,resourceId:{kind:'youtube#video',videoId:vid}};
        const old=retained.get(vid);
        if(!old)await api.playlistItems.insert({part:['snippet'],requestBody:{snippet}});
        else await api.playlistItems.update({part:['snippet'],requestBody:{id:old.id,snippet}});
      }
      await api.playlists.update({part:['snippet','status'],requestBody:{id:playlistId,snippet:{title:`${plan.date}-FBCP`,description:'FBCP rehearsal · selected live performances · Gracefeed Worship'},status:{privacyStatus:'unlisted'}}});
      return playlistId;
    }
  };
}
