import {initializeApp, applicationDefault} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('Set GCLOUD_PROJECT or FIREBASE_PROJECT_ID to the Firebase project to migrate.');
const apply = process.argv.includes('--apply');
const app = initializeApp({credential: applicationDefault(), projectId}, 'legacy-data-migration');
const db = getFirestore(app);

async function migratePlayers() {
  let last;
  let count = 0;
  while (true) {
    let query = db.collection('jugadores').orderBy('__name__').limit(400);
    if (last) query = query.startAfter(last);
    const snapshot = await query.get();
    if (snapshot.empty) return count;
    const batch = db.batch();
    for (const playerDoc of snapshot.docs) {
      const player = playerDoc.data();
      const stats = {
        uid: playerDoc.id,
        username: String(player.username || 'Hacker').slice(0, 32),
        level: Number(player.level || 1),
        xp: Number(player.xp || 0),
        credits: Number(player.credits || 0),
        clan: player.clan || null,
      };
      if (apply) batch.set(db.collection('jugadores_publicos').doc(playerDoc.id), stats, {merge: false});
      count++;
    }
    if (apply && snapshot.size) await batch.commit();
    last = snapshot.docs[snapshot.docs.length - 1];
  }
}

async function migrateClanMessages() {
  let last;
  let count = 0;
  while (true) {
    let query = db.collection('mensajes').orderBy('__name__').limit(400);
    if (last) query = query.startAfter(last);
    const snapshot = await query.get();
    if (snapshot.empty) return count;
    const batch = db.batch();
    let batchCount = 0;
    for (const messageDoc of snapshot.docs) {
      const message = messageDoc.data();
      if (typeof message.channel !== 'string' || !message.channel.startsWith('clan_') || message.clanId) continue;
      const clanId = message.channel.slice('clan_'.length);
      if (!clanId) continue;
      if (apply) batch.update(messageDoc.ref, {clanId});
      count++;
      batchCount++;
    }
    if (apply && batchCount) await batch.commit();
    last = snapshot.docs[snapshot.docs.length - 1];
  }
}

try {
  const [players, clanMessages] = await Promise.all([migratePlayers(), migrateClanMessages()]);
  console.log(JSON.stringify({mode: apply ? 'apply' : 'dry-run', playerProfiles: players, clanMessages}));
  if (!apply) console.log('Dry run completed; no data changed. Use --apply after reviewing counts to create public leaderboard projections and add clanId metadata.');
} finally {
  await app.delete();
}
