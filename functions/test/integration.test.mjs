import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';

const projectId = 'red-obscura-rules-test';
const authUrl = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key';
const app = initializeApp({projectId}, 'integration-tests');
const adminDb = getFirestore(app);
let aliceToken;
let aliceUid;
let bobToken;
let bobUid;
let missionToken;
let missionUid;

async function createUser(email) {
  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email, password: 'test-password-123', returnSecureToken: true}),
  });
  const body = await response.json();
  assert.equal(response.ok, true, JSON.stringify(body));
  return {uid: body.localId, token: body.idToken};
}

async function call(name, token, data = {}) {
  const response = await fetch(`http://127.0.0.1:5001/${projectId}/us-central1/${name}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
    body: JSON.stringify({data}),
  });
  const body = await response.json();
  if (!response.ok || body.error) throw new Error(body.error?.message || `Callable ${name} failed`);
  return body.result;
}

before(async () => {
  const alice = await createUser(`alice-${Date.now()}@example.test`);
  const bob = await createUser(`bob-${Date.now()}@example.test`);
  const missionPlayer = await createUser(`mission-${Date.now()}@example.test`);
  aliceToken = alice.token;
  aliceUid = alice.uid;
  bobToken = bob.token;
  bobUid = bob.uid;
  missionToken = missionPlayer.token;
  missionUid = missionPlayer.uid;
  await call('ensurePlayer', aliceToken);
  await call('ensurePlayer', bobToken);
  await call('ensurePlayer', missionToken);
  await adminDb.collection('misiones').doc('integration-mission').set({
    objetivo: 2,
    eventos: ['mine'],
    recompensa: {xp: 20, credits: 30},
  });
});

after(async () => adminDb.terminate());

test('mining has server cooldown and cannot be repeated to mint credits', async () => {
  const first = await call('mine', aliceToken);
  assert.equal(first.credits, 2);
  await assert.rejects(call('mine', aliceToken), /enfriamiento/i);
});

test('script upgrades validate names and charge credits server-side', async () => {
  const playerRef = adminDb.collection('jugadores').doc(aliceUid);
  const beforePlayer = await playerRef.get();
  const beforeCredits = beforePlayer.data().credits;
  const result = await call('upgradeScript', aliceToken, {script: 'mineria'});
  assert.equal(result.level, 2);
  assert.equal((await playerRef.get()).data().credits, beforeCredits - 50);
  await assert.rejects(call('upgradeScript', aliceToken, {script: 'credits'}));
});

test('node capture and reward are calculated atomically by the server', async () => {
  await call('ensureWorld', aliceToken);
  await adminDb.collection('jugadores').doc(bobUid).update({level: 10});
  const result = await call('claimNode', aliceToken, {nodeId: 'nodo-alfa'});
  assert.equal(result.success, true);
  assert.equal((await adminDb.collection('nodos').doc('nodo-alfa').get()).data().owner, aliceUid);
  await assert.rejects(call('claimNode', aliceToken, {nodeId: 'nodo-alfa'}));
  const beforeCredits = (await adminDb.collection('jugadores').doc(bobUid).get()).data().credits;
  const secondClaim = await call('claimNode', bobToken, {nodeId: 'nodo-alfa'});
  assert.equal(secondClaim.success, true);
  assert.equal((await adminDb.collection('nodos').doc('nodo-alfa').get()).data().owner, bobUid);
  assert.equal((await adminDb.collection('jugadores').doc(bobUid).get()).data().credits, beforeCredits + secondClaim.reward - secondClaim.cost);
});

test('clan balances are transactional and only the leader can withdraw', async () => {
  const {clanId} = await call('createClan', aliceToken, {name: 'Test clan'});
  await call('joinClan', bobToken, {clanId});
  await call('depositClan', bobToken, {amount: 10});
  await assert.rejects(call('withdrawClan', bobToken, {amount: 1}));
  await call('withdrawClan', aliceToken, {amount: 5});
  const clan = (await adminDb.collection('clanes').doc(clanId).get()).data();
  assert.equal(clan.bank, 5);
  await assert.rejects(call('depositClan', bobToken, {amount: -1}));
  await assert.rejects(call('depositClan', bobToken, {amount: 1.5}));
});

test('mission progress comes from verified actions and its reward is paid exactly once', async () => {
  const before = await adminDb.collection('jugadores').doc(missionUid).get();
  const initial = await call('advanceMission', missionToken, {missionId: 'integration-mission'});
  assert.equal(initial.progress, 0);
  assert.equal(initial.completed, false);
  await call('mine', missionToken);
  let progress = (await adminDb.collection('progreso_misiones').doc(missionUid).get()).data();
  assert.equal(progress['integration-mission'].progreso, 1);
  await new Promise((resolve) => setTimeout(resolve, 10010));
  await call('mine', missionToken);
  progress = (await adminDb.collection('progreso_misiones').doc(missionUid).get()).data();
  assert.equal(progress['integration-mission'].completada, true);
  const after = await adminDb.collection('jugadores').doc(missionUid).get();
  assert.equal(after.data().credits - before.data().credits, 34);
  const completion = await call('advanceMission', missionToken, {missionId: 'integration-mission'});
  assert.equal(completion.completed, true);
  assert.equal((await adminDb.collection('jugadores').doc(missionUid).get()).data().credits, after.data().credits);
});

test('chat validates content, rate-limits sends, and checks clan membership', async () => {
  await call('sendChat', aliceToken, {text: 'hello world', channel: 'global'});
  await assert.rejects(call('sendChat', aliceToken, {text: 'spam', channel: 'global'}));
  await assert.rejects(call('sendChat', bobToken, {text: 'no clan', channel: 'clan_not-a-member'}));
  await assert.rejects(call('sendChat', bobToken, {text: 'x'.repeat(501), channel: 'global'}));
  await new Promise((resolve) => setTimeout(resolve, 1600));
  await call('sendChat', aliceToken, {text: '/roll', channel: 'global'});
  const messages = await adminDb.collection('mensajes').where('channel', '==', 'global').get();
  assert.ok(messages.docs.some((message) => message.data().text.includes('1d20')));
});
