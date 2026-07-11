'use client';
import React, { useState, useEffect, useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, increment } from 'firebase/firestore';

const NODOS = [
  { id: 'servidor-central', nombre: 'Servidor Central', dificultad: 50 },
  { id: 'nodo-alpha', nombre: 'Nodo Alpha', dificultad: 20 },
  { id: 'nodo-beta', nombre: 'Nodo Beta', dificultad: 25 },
  { id: 'nodo-gamma', nombre: 'Nodo Gamma', dificultad: 30 },
  { id: 'firewall-norte', nombre: 'Firewall Norte', dificultad: 35 },
  { id: 'firewall-sur', nombre: 'Firewall Sur', dificultad: 35 },
  { id: 'datacenter-1', nombre: 'Datacenter 1', dificultad: 40 },
  { id: 'datacenter-2', nombre: 'Datacenter 2', dificultad: 40 },
  { id: 'red-satelital', nombre: 'Red Satelital', dificultad: 45 }
];

export default function Mapa() {
  const { player, updatePlayer } = useContext(GameContext);
  const [territorios, setTerritorios] = useState({});
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'territorios'), (snap) => {
      const data = {};
      snap.forEach((d) => { data[d.id] = d.data(); });
      setTerritorios(data);
    });
    return () => unsub();
  }, []);

  const conquistar = async (nodo) => {
    if (!player) return;
    const costo = nodo.dificultad * 5;
    if (player.credits < costo) {
      setMensaje(`Necesitas ${costo} créditos para atacar ${nodo.nombre}.`);
      return;
    }
    const territorio = territorios[nodo.id];
    if (territorio && territorio.ownerUid === player.uid) {
      setMensaje(`Ya controlas ${nodo.nombre}.`);
      return;
    }
    // Probabilidad de éxito basada en nivel del jugador vs dificultad
    const exito = Math.random() * 100 + (player.level || 1) * 3 > nodo.dificultad;
    await updatePlayer({ credits: increment(-costo) });
    if (exito) {
      await setDoc(doc(db, 'territorios', nodo.id), {
        nombre: nodo.nombre,
        ownerUid: player.uid,
        ownerName: player.username,
        clan: player.clan || null,
        conqueredAt: Date.now()
      });
      await updatePlayer({ xp: increment(nodo.dificultad) });
      setMensaje(`¡Conquistaste ${nodo.nombre}! (+${nodo.dificultad} XP)`);
    } else {
      setMensaje(`El ataque a ${nodo.nombre} falló. Perdiste ${costo} créditos.`);
    }
  };

  return (
    <div className="panel">
      <h2>🗺️ Mapa de la Red Oscura</h2>
      <p style={{ fontSize: 12, marginBottom: 15, opacity: 0.8 }}>
        Ataca nodos para conquistar territorio. El éxito depende de tu nivel y de la dificultad del nodo.
      </p>
      {mensaje && (
        <div style={{
          background: 'rgba(0, 255, 65, 0.1)',
          border: '1px solid #00ff41',
          padding: 10,
          borderRadius: 5,
          marginBottom: 15,
          fontSize: 12
        }}>
          {mensaje}
        </div>
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12
      }}>
        {NODOS.map((nodo) => {
          const territorio = territorios[nodo.id];
          const propio = territorio && territorio.ownerUid === player?.uid;
          const costo = nodo.dificultad * 5;
          return (
            <div key={nodo.id} style={{
              background: propio ? 'rgba(0, 255, 65, 0.15)' : 'rgba(22, 33, 62, 0.9)',
              border: `2px solid ${propio ? '#00ff41' : '#ff1744'}`,
              borderRadius: 8,
              padding: 12
            }}>
              <h3 style={{ fontSize: 14, marginBottom: 6 }}>{nodo.nombre}</h3>
              <p style={{ fontSize: 11, marginBottom: 4 }}>Dificultad: {nodo.dificultad}</p>
              <p style={{ fontSize: 11, marginBottom: 8 }}>
                Dueño: {territorio ? (propio ? 'Tú' : territorio.ownerName) : 'Libre'}
              </p>
              <button
                onClick={() => conquistar(nodo)}
                disabled={propio}
                style={{
                  width: '100%',
                  cursor: propio ? 'not-allowed' : 'pointer',
                  opacity: propio ? 0.5 : 1
                }}
              >
                {propio ? 'Controlado' : `Atacar (${costo} 💰)`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
