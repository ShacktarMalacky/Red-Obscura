'use client';
import React, { useState, useEffect, useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, increment } from 'firebase/firestore';

// Nodos iniciales de la Red Oscura. Se siembran en Firestore la primera vez.
const NODOS_INICIALES = [
  { id: 'nodo-alfa', name: 'Nodo Alfa', defense: 10, reward: 50, x: 15, y: 20 },
  { id: 'nodo-beta', name: 'Nodo Beta', defense: 25, reward: 90, x: 55, y: 15 },
  { id: 'nodo-gamma', name: 'Nodo Gamma', defense: 40, reward: 140, x: 80, y: 35 },
  { id: 'nodo-delta', name: 'Nodo Delta', defense: 60, reward: 210, x: 30, y: 55 },
  { id: 'nodo-omega', name: 'Nodo Omega', defense: 100, reward: 400, x: 65, y: 70 },
];

export default function Mapa() {
  const { player, updatePlayer } = useContext(GameContext);
  const [nodos, setNodos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'nodos'), async (snap) => {
      if (snap.empty) {
        // Sembrar nodos iniciales una sola vez
        await Promise.all(
          NODOS_INICIALES.map((n) =>
            setDoc(doc(db, 'nodos', n.id), {
              name: n.name,
              defense: n.defense,
              reward: n.reward,
              x: n.x,
              y: n.y,
              owner: null,
              ownerName: null,
            })
          )
        );
        return;
      }
      setNodos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const conquistar = async (nodo) => {
    if (!player) return;
    if (nodo.owner === player.uid) {
      setMensaje('Ya controlas este nodo.');
      return;
    }
    const costo = nodo.defense * 5;
    if (player.credits < costo) {
      setMensaje(`Necesitas ${costo} créditos para atacar ${nodo.name}.`);
      return;
    }
    // El ataque tiene éxito si superas la defensa del nodo (nivel del jugador + suerte)
    const poder = (player.level || 1) * 10 + Math.floor(Math.random() * 50);
    if (poder < nodo.defense) {
      await updatePlayer({ credits: increment(-costo) });
      setMensaje(`Ataque fallido a ${nodo.name}. Perdiste ${costo} créditos. (Poder ${poder} vs Defensa ${nodo.defense})`);
      return;
    }
    await updateDoc(doc(db, 'nodos', nodo.id), {
      owner: player.uid,
      ownerName: player.username || 'Hacker',
      defense: increment(5),
    });
    await updatePlayer({ credits: increment(nodo.reward - costo), xp: increment(nodo.defense) });
    setMensaje(`¡Conquistaste ${nodo.name}! +${nodo.reward} créditos, +${nodo.defense} XP.`);
  };

  const nodosPropios = nodos.filter((n) => n.owner === player?.uid).length;

  return (
    <div className="panel">
      <h2>🗺️ Mapa de la Red Oscura</h2>
      <p style={{ marginBottom: 10, fontSize: 13 }}>
        Conquista nodos para ganar créditos y territorio. Nodos bajo tu control:{' '}
        <strong style={{ color: '#ff1744' }}>{nodosPropios}</strong>
      </p>

      {mensaje && (
        <div
          style={{
            background: 'rgba(0, 255, 65, 0.1)',
            border: '1px solid #00ff41',
            padding: 10,
            borderRadius: 5,
            marginBottom: 12,
            fontSize: 12,
          }}
        >
          {mensaje}
        </div>
      )}

      {/* Vista del mapa */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 260,
          background: 'rgba(10, 14, 39, 0.6)',
          border: '1px solid rgba(0, 255, 65, 0.4)',
          borderRadius: 8,
          marginBottom: 15,
          overflow: 'hidden',
        }}
      >
        {nodos.map((nodo) => {
          const propio = nodo.owner === player?.uid;
          const ocupado = nodo.owner && !propio;
          const color = propio ? '#00ff41' : ocupado ? '#ff1744' : '#7dd3fc';
          return (
            <button
              key={nodo.id}
              onClick={() => setSeleccionado(nodo)}
              title={nodo.name}
              style={{
                position: 'absolute',
                left: `${nodo.x}%`,
                top: `${nodo.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: color,
                border: seleccionado?.id === nodo.id ? '3px solid #fff' : `2px solid ${color}`,
                boxShadow: `0 0 12px ${color}`,
                cursor: 'pointer',
                padding: 0,
              }}
              aria-label={`Nodo ${nodo.name}`}
            />
          );
        })}
      </div>

      {/* Detalle del nodo seleccionado */}
      {seleccionado ? (
        <div
          style={{
            border: '1px solid rgba(0, 255, 65, 0.4)',
            borderRadius: 6,
            padding: 12,
          }}
        >
          <h3 style={{ marginBottom: 8 }}>{seleccionado.name}</h3>
          <p style={{ fontSize: 13, marginBottom: 4 }}>🛡️ Defensa: {seleccionado.defense}</p>
          <p style={{ fontSize: 13, marginBottom: 4 }}>💰 Recompensa: {seleccionado.reward}</p>
          <p style={{ fontSize: 13, marginBottom: 4 }}>
            👤 Controlado por:{' '}
            {seleccionado.owner
              ? seleccionado.owner === player?.uid
                ? 'Ti'
                : seleccionado.ownerName || 'otro hacker'
              : 'Nadie'}
          </p>
          <p style={{ fontSize: 12, marginBottom: 10, color: '#7dd3fc' }}>
            Coste del ataque: {seleccionado.defense * 5} créditos
          </p>
          <button
            onClick={() => conquistar(seleccionado)}
            disabled={seleccionado.owner === player?.uid}
            style={{ width: '100%' }}
          >
            {seleccionado.owner === player?.uid ? 'Nodo controlado' : 'Atacar nodo'}
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 13, opacity: 0.8 }}>Selecciona un nodo del mapa para ver sus detalles.</p>
      )}
    </div>
  );
}
