'use client';
import React, { useState, useEffect, useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { db } from '../firebase';
import {collection, onSnapshot} from 'firebase/firestore';
import {claimNode, ensureWorld} from '../gameActions';

export default function Mapa() {
  const {player} = useContext(GameContext);
  const [nodos, setNodos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    ensureWorld().catch((error) => console.error('Error al preparar el mapa:', error));
    const unsub = onSnapshot(collection(db, 'nodos'), (snap) => {
      setNodos(snap.docs.map((d) => ({id: d.id, ...d.data()})));
    });
    return () => unsub();
  }, []);

  const conquistar = async (nodo) => {
    if (!player) return;
    try {
      const result = await claimNode(nodo.id);
      if (result.success) {
        setMensaje(`¡Conquistaste ${result.nodeName}! +${result.reward} créditos, +${result.xp} XP.`);
      } else {
        setMensaje(`Ataque fallido a ${result.nodeName}. Perdiste ${result.cost} créditos. (Poder ${result.power} vs Defensa ${result.defense})`);
      }
    } catch (error) {
      setMensaje(error?.message || 'No se pudo completar el ataque.');
    }
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
