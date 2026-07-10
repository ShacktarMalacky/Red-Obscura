'use client';
import React, { useState, useEffect, useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, increment, arrayUnion, arrayRemove, query, where } from 'firebase/firestore';

export default function Clan() {
  const { player, updatePlayer } = useContext(GameContext);
  const [clan, setClan] = useState(null);
  const [clanesDisponibles, setClanesDisponibles] = useState([]);
  const [nombreNuevoClan, setNombreNuevoClan] = useState('');
  const [depositAmount, setDepositAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);

  useEffect(() => {
    if (!player || !player.clan) { setClan(null); return; }
    const unsub = onSnapshot(doc(db, 'clanes', player.clan), (snap) => { if (snap.exists()) setClan({ id: snap.id, ...snap.data() }); });
    return () => unsub();
  }, [player?.clan]);

  useEffect(() => {
    const q = query(collection(db, 'clanes'), where('publico', '==', true));
    const unsub = onSnapshot(q, (snap) => setClanesDisponibles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => unsub();
  }, []);

  const crearClan = async () => {
    if (!nombreNuevoClan.trim() || !player) return;
    const nuevoClan = { name: nombreNuevoClan, leader: player.uid, members: [player.uid], bank: 0, defense: 10, publico: true, createdAt: Date.now() };
    const docRef = await addDoc(collection(db, 'clanes'), nuevoClan);
    await updatePlayer({ clan: docRef.id });
    setNombreNuevoClan('');
  };

  const unirseAClan = async (clanId) => {
    if (!player || player.clan) return;
    await updatePlayer({ clan: clanId });
    await updateDoc(doc(db, 'clanes', clanId), { members: arrayUnion(player.uid) });
  };

  const salirDelClan = async () => {
    if (!player || !player.clan) return;
    const oldClanId = player.clan;
    await updatePlayer({ clan: null });
    await updateDoc(doc(db, 'clanes', oldClanId), { members: arrayRemove(player.uid) });
  };

  const depositar = async () => {
    if (depositAmount <= 0 || depositAmount > player.credits) return;
    await updateDoc(doc(db, 'clanes', player.clan), { bank: increment(depositAmount) });
    await updatePlayer({ credits: increment(-depositAmount) });
    setDepositAmount(0);
  };

  const retirar = async () => {
    if (withdrawAmount <= 0 || withdrawAmount > clan.bank) return;
    if (player.uid !== clan.leader) return;
    await updateDoc(doc(db, 'clanes', player.clan), { bank: increment(-withdrawAmount) });
    await updatePlayer({ credits: increment(withdrawAmount) });
    setWithdrawAmount(0);
  };

  const mejorarDefensa = async () => {
    if (!clan) return;
    const costo = clan.defense * 10;
    if (clan.bank < costo) return;
    await updateDoc(doc(db, 'clanes', player.clan), { defense: increment(5), bank: increment(-costo) });
  };

  return (
    <div className="panel">
      <h2>🏴 Clan</h2>
      {clan ? (
        <div>
          <h3>{clan.name}</h3>
          <p>Líder: {clan.leader === player.uid ? 'Tú' : clan.leader.slice(0,6)+'...'}</p>
          <p>Miembros: {clan.members.length}</p>
          <p>Banco: 💰 {clan.bank}</p>
          <p>Defensa: 🛡️ {clan.defense}</p>
          <input type="number" value={depositAmount} onChange={e => setDepositAmount(Number(e.target.value))} placeholder="Depositar" />
          <button onClick={depositar}>Depositar</button>
          {player.uid === clan.leader && (
            <><input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(Number(e.target.value))} placeholder="Retirar" /><button onClick={retirar}>Retirar</button></>
          )}
          <button onClick={mejorarDefensa} disabled={clan.bank < clan.defense * 10}>Mejorar defensa ({clan.defense*10})</button>
          <button onClick={salirDelClan} style={{background:'#ff0040',color:'#fff',marginTop:10}}>Abandonar clan</button>
        </div>
      ) : (
        <div>
          <p>No perteneces a ningún clan.</p>
          <input value={nombreNuevoClan} onChange={e => setNombreNuevoClan(e.target.value)} placeholder="Nombre del nuevo clan" />
          <button onClick={crearClan} style={{width:'100%'}}>Crear clan</button>
          <h3>Clanes disponibles</h3>
          {clanesDisponibles.filter(c => !c.members.includes(player?.uid)).map(c => (
            <div key={c.id} style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
              <span>{c.name} ({c.members.length} miembros)</span>
              <button onClick={() => unirseAClan(c.id)}>Unirse</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
