import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {onDocumentWritten} from "firebase-functions/v2/firestore";

initializeApp();
setGlobalOptions({maxInstances: 10, region: "us-central1"});

const db = getFirestore();
const NODE_SEEDS = [
  {id: "nodo-alfa", name: "Nodo Alfa", defense: 10, reward: 50, x: 15, y: 20},
  {id: "nodo-beta", name: "Nodo Beta", defense: 25, reward: 90, x: 55, y: 15},
  {id: "nodo-gamma", name: "Nodo Gamma", defense: 40, reward: 140, x: 80, y: 35},
  {id: "nodo-delta", name: "Nodo Delta", defense: 60, reward: 210, x: 30, y: 55},
  {id: "nodo-omega", name: "Nodo Omega", defense: 100, reward: 400, x: 65, y: 70},
];
const SCRIPT_COSTS: Record<string, number> = {mineria: 50, defensa: 75, ataque: 100};

function uidFrom(request: {auth?: {uid: string} | null}): string {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Inicia sesión para realizar esta acción.");
  return uid;
}

function playerRef(uid: string) {
  return db.collection("jugadores").doc(uid);
}

function finitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export const ensurePlayer = onCall(async (request) => {
  const uid = uidFrom(request);
  const ref = playerRef(uid);
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.exists) return;
    const username = `Hacker_${Math.floor(Math.random() * 10000)}`;
    transaction.create(ref, {
      uid,
      username,
      level: 1,
      xp: 0,
      credits: 100,
      clan: null,
      scripts: {
        mineria: {level: 1, active: true},
        defensa: {level: 0, active: false},
        ataque: {level: 0, active: false},
      },
      createdAt: Date.now(),
      lastMinedAt: 0,
    });
  });
  const snap = await ref.get();
  const player = snap.data()!;
  await db.collection("jugadores_publicos").doc(uid).set({
    uid,
    username: String(player.username || "Hacker").slice(0, 32),
    level: Number(player.level || 1),
    xp: Number(player.xp || 0),
    credits: Number(player.credits || 0),
    clan: player.clan || null,
  }, {merge: false});
  return player;
});

export const ensureWorld = onCall(async (request) => {
  uidFrom(request);
  await db.runTransaction(async (transaction) => {
    const refs = NODE_SEEDS.map((node) => db.collection("nodos").doc(node.id));
    const snaps = await Promise.all(refs.map((ref) => transaction.get(ref)));
    snaps.forEach((snap, index) => {
      if (!snap.exists) {
        const node = {...NODE_SEEDS[index]};
        delete (node as {id?: string}).id;
        transaction.create(refs[index], {...node, owner: null, ownerName: null});
      }
    });
  });
  return {ok: true};
});

export const mine = onCall(async (request) => {
  const uid = uidFrom(request);
  const ref = playerRef(uid);
  const now = Date.now();
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new HttpsError("failed-precondition", "No existe el perfil del jugador.");
    const player = snap.data()!;
    const lastMinedAt = Number(player.lastMinedAt || 0);
    if (now - lastMinedAt < 10000) {
      throw new HttpsError("resource-exhausted", "La minería todavía está en enfriamiento.");
    }
    const level = Math.max(1, Math.min(100, Number(player.scripts?.mineria?.level) || 1));
    if (player.scripts?.mineria?.active !== true) {
      throw new HttpsError("failed-precondition", "La minería está desactivada.");
    }
    const xp = Number(player.xp || 0) + level;
    const credits = Number(player.credits || 0) + 2 * level;
    transaction.update(ref, {xp, credits, lastMinedAt: now});
    return {xp: level, credits: 2 * level, username: String(player.username || "Hacker").slice(0, 32)};
  }).then(async (result) => {
    await db.collection("mensajes").add({
      channel: "global",
      user: "Sistema",
      text: `${result.username} ha minado datos (+${result.xp} XP, +${result.credits} créditos).`,
      timestamp: now,
      uid: "sistema",
    });
    return {xp: result.xp, credits: result.credits};
  });
});

export const upgradeScript = onCall(async (request) => {
  const uid = uidFrom(request);
  const script = request.data?.script;
  if (typeof script !== "string" || !(script in SCRIPT_COSTS)) {
    throw new HttpsError("invalid-argument", "El tipo de script no es válido.");
  }
  const ref = playerRef(uid);
  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new HttpsError("failed-precondition", "No existe el perfil del jugador.");
    const player = snap.data()!;
    const currentLevel = Number(player.scripts?.[script]?.level || 0);
    if (currentLevel >= 100) throw new HttpsError("failed-precondition", "El script alcanzó el nivel máximo.");
    const cost = SCRIPT_COSTS[script] * Math.max(1, currentLevel);
    const credits = Number(player.credits || 0);
    if (credits < cost) throw new HttpsError("failed-precondition", "No tienes créditos suficientes.");
    transaction.update(ref, {
      [`scripts.${script}.level`]: currentLevel + 1,
      credits: credits - cost,
      publicStats: {level: Number(player.level || 1), xp: Number(player.xp || 0), credits: credits - cost, clan: player.clan || null},
    });
    return {level: currentLevel + 1, cost};
  });
});

export const claimNode = onCall(async (request) => {
  const uid = uidFrom(request);
  const nodeId = request.data?.nodeId;
  const seed = NODE_SEEDS.find((node) => node.id === nodeId);
  if (!seed) throw new HttpsError("invalid-argument", "El nodo solicitado no existe.");
  const userRef = playerRef(uid);
  const nodeRef = db.collection("nodos").doc(seed.id);
  const powerRoll = Math.floor(Math.random() * 50);
  return db.runTransaction(async (transaction) => {
    const [userSnap, nodeSnap] = await Promise.all([transaction.get(userRef), transaction.get(nodeRef)]);
    if (!userSnap.exists) throw new HttpsError("failed-precondition", "No existe el perfil del jugador.");
    const player = userSnap.data()!;
    const seedData: Record<string, unknown> = {...seed};
    delete seedData.id;
    const node: FirebaseFirestore.DocumentData = nodeSnap.exists ? nodeSnap.data()! : {...seedData, owner: null, ownerName: null};
    if (Number(node.reward) !== seed.reward || Number(node.x) !== seed.x || Number(node.y) !== seed.y) {
      throw new HttpsError("failed-precondition", "La configuración del nodo no es válida.");
    }
    if (node.owner === uid) throw new HttpsError("failed-precondition", "Ya controlas este nodo.");
    const defense = Number(node.defense);
    const cost = defense * 5;
    const credits = Number(player.credits || 0);
    if (credits < cost) throw new HttpsError("failed-precondition", "No tienes créditos suficientes.");
    const power = Math.max(1, Number(player.level) || 1) * 10 + powerRoll;
    if (power < defense) {
      transaction.update(userRef, {
        credits: credits - cost,
        publicStats: {level: Number(player.level || 1), xp: Number(player.xp || 0), credits: credits - cost, clan: player.clan || null},
      });
      if (!nodeSnap.exists) transaction.create(nodeRef, node);
      return {success: false, cost, power, defense, reward: 0, xp: 0, nodeName: node.name};
    }
    const reward = Number(node.reward);
    const claimedNode = {
      ...node,
      owner: uid,
      ownerName: String(player.username || "Hacker").slice(0, 32),
      defense: defense + 5,
    };
    if (nodeSnap.exists) transaction.update(nodeRef, claimedNode);
    else transaction.create(nodeRef, claimedNode);
    const xp = Number(player.xp || 0) + defense;
    transaction.update(userRef, {
      credits: credits + reward - cost,
      xp,
      publicStats: {
        level: Number(player.level || 1), xp, credits: credits + reward - cost,
        clan: player.clan || null,
      },
    });
    return {success: true, cost, power, defense, reward, xp: defense, nodeName: node.name};
  });
});

export const advanceMission = onCall(async (request) => {
  const uid = uidFrom(request);
  const missionId = request.data?.missionId;
  if (typeof missionId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(missionId)) {
    throw new HttpsError("invalid-argument", "La misión solicitada no es válida.");
  }
  const missionRef = db.collection("misiones").doc(missionId);
  const progressRef = db.collection("progreso_misiones").doc(uid);
  const userRef = playerRef(uid);
  return db.runTransaction(async (transaction) => {
    const [missionSnap, progressSnap, userSnap] = await Promise.all([
      transaction.get(missionRef), transaction.get(progressRef), transaction.get(userRef),
    ]);
    if (!missionSnap.exists) throw new HttpsError("not-found", "La misión no existe.");
    if (!userSnap.exists) throw new HttpsError("failed-precondition", "No existe el perfil del jugador.");
    const mission = missionSnap.data()!;
    const objective = Number(mission.objetivo);
    const rewardXp = Number(mission.recompensa?.xp);
    const rewardCredits = Number(mission.recompensa?.credits);
    if (!Number.isInteger(objective) || objective < 1 || !Number.isFinite(rewardXp) || rewardXp < 0 || !Number.isFinite(rewardCredits) || rewardCredits < 0) {
      throw new HttpsError("failed-precondition", "La misión tiene datos de recompensa inválidos.");
    }
    const progressData = progressSnap.exists ? progressSnap.data()! : {};
    const current = progressData[missionId] || {progreso: 0, completada: false};
    if (current.completada) throw new HttpsError("failed-precondition", "Esta misión ya está completada.");
    const next = Math.min(objective, Number(current.progreso || 0) + 1);
    const completed = next >= objective;
    transaction.set(progressRef, {[missionId]: {progreso: next, completada: completed}}, {merge: true});
    if (completed) {
      const player = userSnap.data()!;
      const xp = Number(player.xp || 0) + rewardXp;
      const credits = Number(player.credits || 0) + rewardCredits;
      transaction.update(userRef, {
        xp, credits,
        publicStats: {level: Number(player.level || 1), xp, credits, clan: player.clan || null},
      });
    }
    return {progress: next, completed, reward: completed ? {xp: rewardXp, credits: rewardCredits} : null};
  });
});

export const sendChat = onCall(async (request) => {
  const uid = uidFrom(request);
  const text = request.data?.text;
  const channel = request.data?.channel;
  if (typeof text !== "string" || text.trim().length < 1 || text.trim().length > 500) {
    throw new HttpsError("invalid-argument", "El mensaje debe tener entre 1 y 500 caracteres.");
  }
  if (channel !== "global" && (typeof channel !== "string" || !/^clan_[A-Za-z0-9_-]{1,128}$/.test(channel))) {
    throw new HttpsError("invalid-argument", "El canal no es válido.");
  }
  const userRef = playerRef(uid);
  const now = Date.now();
  const player = await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) throw new HttpsError("failed-precondition", "No existe el perfil del jugador.");
    const current = userSnap.data()!;
    if (now - Number(current.lastChatAt || 0) < 1500) {
      throw new HttpsError("resource-exhausted", "Espera un momento antes de enviar otro mensaje.");
    }
    transaction.update(userRef, {lastChatAt: now});
    return current;
  });
  if (channel !== "global") {
    const clanId = channel.slice("clan_".length);
    if (player.clan !== clanId) throw new HttpsError("permission-denied", "No perteneces a ese clan.");
    const clanSnap = await db.collection("clanes").doc(clanId).get();
    if (!clanSnap.exists || !clanSnap.data()!.members?.includes(uid)) {
      throw new HttpsError("permission-denied", "No perteneces a ese clan.");
    }
  }
  const cleanText = text.trim();
  if (cleanText.startsWith("/")) {
    if (cleanText !== "/roll") throw new HttpsError("invalid-argument", "Comando no reconocido.");
    const dice = Math.floor(Math.random() * 20) + 1;
    await db.collection("mensajes").add({
      channel,
      clanId: channel === "global" ? null : channel.slice("clan_".length),
      user: "Sistema",
      text: `${String(player.username || "Hacker").slice(0, 32)} ha sacado un ${dice} en 1d20.`,
      timestamp: now,
      uid: "sistema",
    });
    return {ok: true};
  }
  await db.collection("mensajes").add({
    channel,
    clanId: channel === "global" ? null : channel.slice("clan_".length),
    user: String(player.username || "Hacker").slice(0, 32),
    text: cleanText,
    timestamp: now,
    uid,
  });
  return {ok: true};
});

export const createClan = onCall(async (request) => {
  const uid = uidFrom(request);
  const name = request.data?.name;
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 32) {
    throw new HttpsError("invalid-argument", "El nombre del clan debe tener entre 2 y 32 caracteres.");
  }
  const userRef = playerRef(uid);
  const clanRef = db.collection("clanes").doc();
  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) throw new HttpsError("failed-precondition", "No existe el perfil del jugador.");
    if (userSnap.data()!.clan) throw new HttpsError("failed-precondition", "Ya perteneces a un clan.");
    transaction.create(clanRef, {
      name: name.trim(), leader: uid, members: [uid], bank: 0, defense: 10,
      publico: true, createdAt: Date.now(),
    });
    const player = userSnap.data()!;
    transaction.update(userRef, {
      clan: clanRef.id,
      publicStats: {level: Number(player.level || 1), xp: Number(player.xp || 0), credits: Number(player.credits || 0), clan: clanRef.id},
    });
  });
  return {clanId: clanRef.id};
});

export const joinClan = onCall(async (request) => {
  const uid = uidFrom(request);
  const clanId = request.data?.clanId;
  if (typeof clanId !== "string" || !/^[A-Za-z0-9_-]{1,150}$/.test(clanId)) {
    throw new HttpsError("invalid-argument", "El clan solicitado no es válido.");
  }
  const userRef = playerRef(uid);
  const clanRef = db.collection("clanes").doc(clanId);
  await db.runTransaction(async (transaction) => {
    const [userSnap, clanSnap] = await Promise.all([transaction.get(userRef), transaction.get(clanRef)]);
    if (!userSnap.exists) throw new HttpsError("failed-precondition", "No existe el perfil del jugador.");
    if (!clanSnap.exists || clanSnap.data()!.publico !== true) throw new HttpsError("not-found", "El clan no existe o no es público.");
    if (userSnap.data()!.clan) throw new HttpsError("failed-precondition", "Ya perteneces a un clan.");
    const members = Array.isArray(clanSnap.data()!.members) ? clanSnap.data()!.members : [];
    if (members.length >= 100) throw new HttpsError("resource-exhausted", "El clan llegó al límite de miembros.");
    const player = userSnap.data()!;
    transaction.update(userRef, {
      clan: clanId,
      publicStats: {level: Number(player.level || 1), xp: Number(player.xp || 0), credits: Number(player.credits || 0), clan: clanId},
    });
    transaction.update(clanRef, {members: [...new Set([...members, uid])]});
  });
  return {ok: true};
});

export const leaveClan = onCall(async (request) => {
  const uid = uidFrom(request);
  const userRef = playerRef(uid);
  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists || !userSnap.data()!.clan) throw new HttpsError("failed-precondition", "No perteneces a un clan.");
    const clanId = String(userSnap.data()!.clan);
    const clanRef = db.collection("clanes").doc(clanId);
    const clanSnap = await transaction.get(clanRef);
    if (!clanSnap.exists) {
      const player = userSnap.data()!;
      transaction.update(userRef, {
        clan: null,
        publicStats: {level: Number(player.level || 1), xp: Number(player.xp || 0), credits: Number(player.credits || 0), clan: null},
      });
      return;
    }
    const clan = clanSnap.data()!;
    const members = (Array.isArray(clan.members) ? clan.members : []).filter((member: string) => member !== uid);
    const player = userSnap.data()!;
    transaction.update(userRef, {
      clan: null,
      publicStats: {level: Number(player.level || 1), xp: Number(player.xp || 0), credits: Number(player.credits || 0), clan: null},
    });
    if (members.length === 0) {
      transaction.delete(clanRef);
    } else {
      transaction.update(clanRef, {
        members,
        ...(clan.leader === uid ? {leader: members[0]} : {}),
      });
    }
  });
  return {ok: true};
});

export const depositClan = onCall(async (request) => {
  const uid = uidFrom(request);
  const amount = request.data?.amount;
  if (!finitePositive(amount) || !Number.isInteger(amount) || amount > 1000000) throw new HttpsError("invalid-argument", "La cantidad debe ser un entero positivo.");
  const userRef = playerRef(uid);
  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists || !userSnap.data()!.clan) throw new HttpsError("failed-precondition", "No perteneces a un clan.");
    const user = userSnap.data()!;
    if (Number(user.credits || 0) < amount) throw new HttpsError("failed-precondition", "No tienes créditos suficientes.");
    const clanRef = db.collection("clanes").doc(String(user.clan));
    const clanSnap = await transaction.get(clanRef);
    if (!clanSnap.exists || !clanSnap.data()!.members?.includes(uid)) throw new HttpsError("permission-denied", "No eres miembro de ese clan.");
    transaction.update(userRef, {
      credits: Number(user.credits || 0) - amount,
      publicStats: {level: Number(user.level || 1), xp: Number(user.xp || 0), credits: Number(user.credits || 0) - amount, clan: user.clan},
    });
    transaction.update(clanRef, {bank: Number(clanSnap.data()!.bank || 0) + amount});
  });
  return {ok: true};
});

export const withdrawClan = onCall(async (request) => {
  const uid = uidFrom(request);
  const amount = request.data?.amount;
  if (!finitePositive(amount) || !Number.isInteger(amount) || amount > 1000000) throw new HttpsError("invalid-argument", "La cantidad debe ser un entero positivo.");
  const userRef = playerRef(uid);
  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists || !userSnap.data()!.clan) throw new HttpsError("failed-precondition", "No perteneces a un clan.");
    const user = userSnap.data()!;
    const clanRef = db.collection("clanes").doc(String(user.clan));
    const clanSnap = await transaction.get(clanRef);
    if (!clanSnap.exists || !clanSnap.data()!.members?.includes(uid)) throw new HttpsError("permission-denied", "No eres miembro de ese clan.");
    const clan = clanSnap.data()!;
    if (clan.leader !== uid) throw new HttpsError("permission-denied", "Solo el líder puede retirar créditos.");
    if (Number(clan.bank || 0) < amount) throw new HttpsError("failed-precondition", "El banco no tiene suficientes créditos.");
    transaction.update(userRef, {
      credits: Number(user.credits || 0) + amount,
      publicStats: {level: Number(user.level || 1), xp: Number(user.xp || 0), credits: Number(user.credits || 0) + amount, clan: user.clan},
    });
    transaction.update(clanRef, {bank: Number(clan.bank || 0) - amount});
  });
  return {ok: true};
});

export const upgradeClanDefense = onCall(async (request) => {
  const uid = uidFrom(request);
  const userRef = playerRef(uid);
  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists || !userSnap.data()!.clan) throw new HttpsError("failed-precondition", "No perteneces a un clan.");
    const clanRef = db.collection("clanes").doc(String(userSnap.data()!.clan));
    const clanSnap = await transaction.get(clanRef);
    if (!clanSnap.exists || !clanSnap.data()!.members?.includes(uid)) throw new HttpsError("permission-denied", "No eres miembro de ese clan.");
    const clan = clanSnap.data()!;
    const cost = Number(clan.defense || 10) * 10;
    if (Number(clan.bank || 0) < cost) throw new HttpsError("failed-precondition", "El banco no tiene suficientes créditos.");
    transaction.update(clanRef, {defense: Number(clan.defense || 10) + 5, bank: Number(clan.bank || 0) - cost});
  });
  return {ok: true};
});


// Keep only leaderboard-safe fields in a separate collection. Authenticated
// clients can read this projection without exposing private player documents.
export const publishPlayerStats = onDocumentWritten("jugadores/{uid}", async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after;
  const publicRef = db.collection("jugadores_publicos").doc(uid);
  if (!after?.exists) {
    await publicRef.delete().catch(() => undefined);
    return;
  }
  const player = after.data()!;
  await publicRef.set({
    uid,
    username: String(player.username || "Hacker").slice(0, 32),
    level: Number(player.level || 1),
    xp: Number(player.xp || 0),
    credits: Number(player.credits || 0),
    clan: player.clan || null,
  }, {merge: false});
});
