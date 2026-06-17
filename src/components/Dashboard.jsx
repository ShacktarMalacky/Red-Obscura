'use client';
import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';
import Chat from './Chat';
import Misiones from './Misiones';
import Clan from './Clan';
import Mapa from './Mapa';

export default function Dashboard() {
  const { player, loading } = useContext(GameContext);
  if (loading) return <div className="loading">Conectando a la Red...</div>;
  if (!player) return <div className="loading">Cargando perfil...</div>;
  return (
    <div className="dashboard">
      <header>
        <h1 className="neon-text">🔴 RED OSCURA</h1>
        <div className="player-info">
          <span>👤 {player.username}</span>
          <span>🎚️ Nivel {player.level}</span>
          <span>💰 {player.credits}</span>
          <span>⭐ {player.xp} XP</span>
        </div>
      </header>
      <div className="game-grid">
        <div className="left-column"><Clan /><Mapa /></div>
        <div className="center-column"><Chat /></div>
        <div className="right-column"><Misiones /></div>
      </div>
    </div>
  );
}
