import test from 'node:test';
import assert from 'node:assert/strict';
import {worshipStore} from '../functions/src/store.js';
test('Worship never touches public ShareShuffle collections',()=>{const raw={doc:x=>x,collection:x=>x,runTransaction:fn=>fn('tx')};const db=worshipStore(raw);assert.equal(db.doc('shares/link'),'gracefeedWorship/app/shares/link');assert.equal(db.collection('plans'),'gracefeedWorship/app/plans');assert.equal(db.doc('worship/settings'),'gracefeedWorship/app/worship/settings');assert.equal(db.runTransaction(x=>x),'tx');});
