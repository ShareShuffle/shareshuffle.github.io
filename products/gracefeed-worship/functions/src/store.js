// Keep all Worship documents below one private product namespace in Gracefeed.
export function worshipStore(firestore) {
  const prefix='gracefeedWorship/app';
  return {
    doc:path=>firestore.doc(`${prefix}/${path}`),
    collection:path=>firestore.collection(`${prefix}/${path}`),
    runTransaction:work=>firestore.runTransaction(work)
  };
}
