import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment, assertFails, assertSucceeds} from '@firebase/rules-unit-testing';
import {collection, doc, getDoc, getDocs, setDoc, updateDoc} from 'firebase/firestore';

const projectId = 'red-obscura-rules-test';
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'jugadores', 'alice'), {
      uid: 'alice', username: 'Alice', credits: 100, xp: 0,
    });
    await setDoc(doc(context.firestore(), 'jugadores_publicos', 'alice'), {
      uid: 'alice', username: 'Alice', level: 1, credits: 100, xp: 0,
    });
    await setDoc(doc(context.firestore(), 'misiones', 'intro'), {objetivo: 1});
    await setDoc(doc(context.firestore(), 'progreso_misiones', 'alice'), {intro: {progreso: 0}});
    await setDoc(doc(context.firestore(), 'clanes', 'clan1'), {leader: 'alice', members: ['alice']});
    await setDoc(doc(context.firestore(), 'mensajes', 'global1'), {channel: 'global', text: 'public'});
    await setDoc(doc(context.firestore(), 'mensajes', 'clan1'), {channel: 'clan_clan1', text: 'private'});
  });
});

after(async () => env?.cleanup());

test('anonymous clients cannot read or write game data', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'jugadores', 'alice')));
  await assertFails(setDoc(doc(db, 'mensajes', 'm1'), {text: 'x'}));
});

test('authenticated players can read public game collections but cannot forge economy writes', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertSucceeds(getDocs(collection(db, 'jugadores_publicos')));
  await assertFails(getDocs(collection(db, 'jugadores')));
  await assertSucceeds(getDocs(collection(db, 'misiones')));
  await assertSucceeds(getDocs(collection(db, 'mensajes')));
  await assertSucceeds(getDoc(doc(db, 'jugadores', 'alice')));
  await assertFails(updateDoc(doc(db, 'jugadores', 'alice'), {credits: 999999}));
  await assertFails(setDoc(doc(db, 'nodos', 'nodo-alfa'), {owner: 'alice'}));
  await assertFails(updateDoc(doc(db, 'progreso_misiones', 'alice'), {intro: {completada: true}}));
  await assertFails(setDoc(doc(db, 'clanes', 'clan1'), {bank: 100000}));
});

test('mission progress is private to its owner', async () => {
  const alice = env.authenticatedContext('alice').firestore();
  const bob = env.authenticatedContext('bob').firestore();
  await assertSucceeds(getDoc(doc(alice, 'progreso_misiones', 'alice')));
  await assertSucceeds(getDoc(doc(alice, 'jugadores', 'alice')));
  await assertFails(getDoc(doc(alice, 'jugadores', 'bob')));
  await assertFails(getDoc(doc(bob, 'progreso_misiones', 'alice')));
});

test('game-state collections reject all direct client message writes', async () => {
  const db = env.authenticatedContext('alice').firestore();
  await assertFails(setDoc(doc(db, 'mensajes', 'direct'), {
    channel: 'global', user: 'Alice', text: 'hello', timestamp: Date.now(), uid: 'alice',
  }));
});
