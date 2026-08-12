'use client';
import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';

export default function Mapa() {
  const { player } = useContext(GameContext);

  const nodos = [
    { id: 'nodo-alpha', nombre: 'Nodo Alpha', nivel: 1, recompensa: 10 },
    { id: 'nodo-beta', nombre: 'Nodo Beta', nivel: 3, recompensa: 30 },
    { id: 'nodo-gamma', nombre: 'Nodo Gamma', nivel: 5, recompensa: 50 },
    { id: 'nodo-delta', nombre: 'Nodo Delta', nivel: 8, recompensa: 80 },
  ];

  return (
    <div style={{ padding: '12px' }}>
      <h3 style={{ color: '#00ff41', marginBottom: 12 }}>🗺️ Mapa de la Red</h3>
      <p style={{ marginBottom: 12, color: '#b0b8cc' }}>
        Selecciona un nodo para infiltrarte y minar créditos. Nivel del hacker: {player?.level ?? 1}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        {nodos.map((nodo) => (
          <div
            key={nodo.id}
            style={{
              border: '1px solid #00ff41',
              borderRadius: 8,
              padding: 14,
              textAlign: 'center',
              background: 'rgba(0,255,65,0.05)',
            }}
          >
            <div style={{ fontSize: 24 }}>{nodo.nivel >= 5 ? '🔴' : nodo.nivel >= 3 ? '🟠' : '🟢'}</div>
            <div style={{ fontWeight: 'bold' }}>{nodo.nombre}</div>
            <div style={{ fontSize: 12, color: '#b0b8cc' }}>Nivel requerido: {nodo.nivel}</div>
            <div style={{ fontSize: 12, color: '#ffd700' }}>Recompensa: +{nodo.recompensa} créditos</div>
          </div>
        ))}
      </div>
    </div>
  );
}
