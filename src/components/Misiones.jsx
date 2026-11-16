'use client';
import React, { useState, useEffect, useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { db } from '../firebase';
import {collection, onSnapshot, doc} from 'firebase/firestore';
import {advanceMission} from '../gameActions';

export default function Misiones() {
  const {player} = useContext(GameContext);
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
      else setProgreso({});
    });
    return () => unsub();
  }, [player?.uid]);

  const avanzar = async (misionId) => {
    if (!player) return;
    try {
      const result = await advanceMission(misionId);
      setProgreso((current) => ({...current, [misionId]: {progreso: result.progress, completada: result.completed}}));
    } catch (error) {
      console.error('Error al avanzar misión:', error);
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
