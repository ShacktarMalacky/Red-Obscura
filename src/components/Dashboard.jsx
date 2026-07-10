'use client';
import React, { useContext, useState } from 'react';
import { GameContext } from '../context/GameContext';
import Chat from './Chat';
import Misiones from './Misiones';
import Clan from './Clan';
import Mapa from './Mapa';
import PlayerStats from './PlayerStats';
import NavBar from './NavBar';
import ScriptUpgrade from './ScriptUpgrade';
import LeaderBoard from './LeaderBoard';
import DigitalClock from './DigitalClock';

export default function Dashboard() {
  const { player, loading } = useContext(GameContext);
  const [activeTab, setActiveTab] = useState('estadisticas');

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#00ff41',
      fontFamily: 'monospace',
      fontSize: 16
    }}>
      Cargando perfil...
    </div>
  );

  if (!player) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ff1744',
      fontFamily: 'monospace',
      fontSize: 16
    }}>
      Error al cargar el perfil
    </div>
  );

  const tabs = [
    { id: 'estadisticas', label: 'Estadísticas', icon: '📊' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'misiones', label: 'Misiones', icon: '📋' },
    { id: 'clan', label: 'Clan', icon: '🏴' },
    { id: 'scripts', label: 'Scripts', icon: '💾' },
    { id: 'mapa', label: 'Mapa', icon: '🗺️' },
    { id: 'ranking', label: 'Ranking', icon: '🏆' },
    { id: 'reloj', label: 'Reloj', icon: '🕐' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #16213e 50%, #0f3460 100%)',
      backgroundAttachment: 'fixed',
      padding: '20px',
      color: '#00ff41',
      fontFamily: 'monospace'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Barra de navegación */}
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />

        {/* Estadísticas del Jugador - Siempre visible */}
        <PlayerStats />

        {/* Contenido dinámico según tab */}
        {activeTab === 'estadisticas' && (
          <div>
            <div style={{
              background: 'rgba(22, 33, 62, 0.9)',
              border: '2px solid #00ff41',
              borderRadius: 8,
              padding: 20,
              marginBottom: 15,
              color: '#00ff41',
              fontFamily: 'monospace'
            }}>
              <h2 style={{ color: '#ff1744', marginBottom: 15 }}>👤 Bienvenido a la Red Oscura</h2>
              <p style={{ marginBottom: 10, lineHeight: '1.6' }}>
                Eres un hacker experimentado navegando por las profundidades de la Red Oscura. 
                Tu objetivo: acumular poder, riqueza y territorio.
              </p>
              <p style={{ marginBottom: 10, lineHeight: '1.6' }}>
                📈 <strong>Sube tu nivel</strong> completando misiones y minando datos<br/>
                💰 <strong>Gana créditos</strong> a través de actividades diarias<br/>
                🏴 <strong>Forma clanes</strong> para conquistar territorios junto con amigos<br/>
                ⚔️ <strong>Participa en el PvP</strong> en el mapa interactivo<br/>
                🎖️ <strong>Sube en el ranking</strong> global y demuestra tu valía
              </p>
              <div style={{
                background: 'rgba(0, 255, 65, 0.1)',
                border: '1px solid #00ff41',
                padding: 10,
                borderRadius: 5,
                marginTop: 15,
                fontSize: 12
              }}>
                💡 <strong>Tip:</strong> Activa la minería en Scripts para ganar créditos automáticamente mientras juegas
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && <Chat />}
        {activeTab === 'misiones' && <Misiones />}
        {activeTab === 'clan' && <Clan />}
        {activeTab === 'scripts' && <ScriptUpgrade />}
        {activeTab === 'mapa' && <Mapa />}
        {activeTab === 'ranking' && <LeaderBoard />}
        {activeTab === 'reloj' && <DigitalClock />}
      </div>
    </div>
  );
}
