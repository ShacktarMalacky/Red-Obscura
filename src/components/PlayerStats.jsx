'use client';
import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';

export default function PlayerStats() {
  const { player } = useContext(GameContext);

  if (!player) return null;

  const xpForNextLevel = player.level * 100;
  const xpProgress = (player.xp % xpForNextLevel) / xpForNextLevel * 100;

  return (
    <div style={{
      background: 'rgba(22, 33, 62, 0.9)',
      border: '2px solid #00ff41',
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      color: '#00ff41',
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 15, marginBottom: 15 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 5 }}>USUARIO</div>
          <div style={{ fontSize: 16, fontWeight: 'bold' }}>{player.username}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 5 }}>NIVEL</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#ff1744' }}>⭐ {player.level}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 5 }}>CRÉDITOS</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#FFD700' }}>💰 {player.credits}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 5 }}>CLAN</div>
          <div style={{ fontSize: 16, fontWeight: 'bold' }}>{player.clan ? '🏴 Unido' : '❌ Sin clan'}</div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
          <span>EXPERIENCIA</span>
          <span>{player.xp} XP</span>
        </div>
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          height: 12,
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid #00ff41'
        }}>
          <div style={{
            background: 'linear-gradient(90deg, #00ff41, #00ff65)',
            height: '100%',
            width: `${xpProgress}%`,
            transition: 'width 0.3s',
            boxShadow: '0 0 10px #00ff41'
          }} />
        </div>
        <div style={{ fontSize: 10, color: '#888', marginTop: 3, textAlign: 'right' }}>
          {Math.floor(player.xp % xpForNextLevel)} / {xpForNextLevel} para siguiente nivel
        </div>
      </div>
    </div>
  );
}
