import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const rc=JSON.parse(readFileSync('.firebaserc','utf8'));
const project=rc.projects?.default;
if(project!=='shareshuffle-c7f96')throw Error('Worship belongs to the Gracefeed/ShareShuffle Firebase project.');
const fn=readFileSync('functions/.env','utf8');const web=readFileSync('.env.local','utf8');
for(const key of ['OWNER_UID','APP_ORIGIN','PCO_SERVICE_TYPE_ID','PCO_PERSON_ID'])if(!new RegExp(`^${key}=.+$`,'m').test(fn))throw Error(`Set ${key} in functions/.env before deployment.`);
for(const key of ['VITE_FIREBASE_API_KEY','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_APP_ID'])if(!new RegExp(`^${key}=.+$`,'m').test(web))throw Error(`Set ${key} in .env.local before deployment.`);
if(!web.includes(`VITE_FIREBASE_PROJECT_ID=${project}`))throw Error('Frontend and deployment project must match.');
for(const args of [['run','test'],['run','build']]){const result=spawnSync('npm',args,{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
const result=spawnSync('node_modules/.bin/firebase',['deploy','--project',project,'--only','functions:worship,hosting:gracefeed-worship'],{stdio:'inherit'});process.exit(result.status||0);
