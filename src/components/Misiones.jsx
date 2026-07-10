'use client';
import React, { useState, useEffect, useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';

export default function Misiones() {
  const { player, updatePlayer } = useContext(GameContext);
  const [misiones, setMisiones] = useState([]);
  const [progreso, setProgreso] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'misiones'), (snap) => setMisiones(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!player) return;
    const unsub = onSnapshot(doc(db, 'progreso_misiones', player.uid), (snap) => {
      if (snap.exists()) setProgreso(snap.data());
      else updateDoc(doc(db, 'progreso_misiones', player.uid), {}).catch(() => {});
    });
    return () => unsub();
  }, [player?.uid]);

  const avanzar = async (misionId) => {
    if (!player) return;
    const mision = misiones.find(m => m.id === misionId);
    if (!mision) return;
    const actual = progreso[misionId]?.progreso || 0;
    const nuevo = actual + 1;
    if (nuevo >= mision.objetivo) {
      await updateDoc(doc(db, 'progreso_misiones', player.uid), { [`${misionId}.progreso`]: mision.objetivo, [`${misionId}.completada`]: true });
      await updatePlayer({ xp: increment(mision.recompensa.xp), credits: increment(mision.recompensa.credits) });
    } else {
      await updateDoc(doc(db, 'progreso_misiones', player.uid), { [`${misionId}.progreso`]: nuevo });
    }
  };

  return (
    <div className="panel">
      <h2>📋 Misiones</h2>
      {misiones.map(m => {
        const prog = progreso[m.id]?.progreso || 0;
        const completada = progreso[m.id]?.completada || false;
        return (
          <div key={m.id} style={{marginBottom:15, borderLeft:'3px solid #00ff41', paddingLeft:10}}>
            <h3>{m.nombre}</h3>
            <p>{m.descripcion}</p>
            <p>Progreso: {prog}/{m.objetivo}</p>
            <p>Recompensa: +{m.recompensa.xp} XP, +{m.recompensa.credits} créditos</p>
            <button onClick={() => avanzar(m.id)} disabled={completada}>{completada ? '✅ Completada' : 'Avanzar (+1)'}</button>
          </div>
        );
      })}
    </div>
  );
}
