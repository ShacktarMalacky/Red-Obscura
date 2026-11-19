import {getFunctions, httpsCallable} from 'firebase/functions';
import {app, isFirebaseConfigured} from './firebase';

const functions = isFirebaseConfigured ? getFunctions(app, 'us-central1') : null;

async function call(name, data = {}) {
  if (!functions) throw new Error('Firebase no está configurado.');
  const result = await httpsCallable(functions, name)(data);
  return result.data;
}

export const ensurePlayer = () => call('ensurePlayer');
export const ensureWorld = () => call('ensureWorld');
export const mine = () => call('mine');
export const upgradeScript = (script) => call('upgradeScript', {script});
export const claimNode = (nodeId) => call('claimNode', {nodeId});
export const advanceMission = (missionId) => call('advanceMission', {missionId});
export const sendChat = (text, channel) => call('sendChat', {text, channel});
export const createClan = (name) => call('createClan', {name});
export const joinClan = (clanId) => call('joinClan', {clanId});
export const leaveClan = () => call('leaveClan');
export const depositClan = (amount) => call('depositClan', {amount});
export const withdrawClan = (amount) => call('withdrawClan', {amount});
export const upgradeClanDefense = () => call('upgradeClanDefense');
