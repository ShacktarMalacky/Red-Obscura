'use client';
import React, { useContext, useState } from 'react';
import { GameContext } from '../context/GameContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

export default function ScriptUpgrade() {
  const { player, updatePlayer } = useContext(GameContext);
  const [selectedScript, setSelectedScript] = useState('mineria');
  const [loading, setLoading] = useState(false);

  const scripts = {
    mineria: {
      name: '⛏️ Minería',
      description: 'Extrae datos y créditos automáticamente',
      costBase: 50,
      color: '#FFD700'
    },
    defensa: {
      name: '🛡️ Defensa',
      description: 'Protege contra ataques de otros hackers',
      costBase: 75,
      color: '#2196F3'
    },
    ataque: {
      name: '⚔️ Ataque',
      description: 'Realiza ataques contra otros jugadores',
      costBase: 100,
      color: '#F44336'
    }
  };

  const currentScript = player?.scripts?.[selectedScript];
  const script = scripts[selectedScript];
  const upgradeCost = script.costBase * (currentScript?.level || 1);

  const handleUpgrade = async () => {
    if (!player || player.credits < upgradeCost) return;
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'jugadores', player.uid), {
        [`scripts.${selectedScript}.level`]: increment(1),
        credits: increment(-upgradeCost)
      });
    } catch (err) {
      console.error('Error al mejorar script:', err);
    }
    setLoading(false);
  };

  if (!player) return null;

  return (
    <div style={{
      background: 'rgba(22, 33, 62, 0.9)',
      border: '2px solid #00ff41',
      borderRadius: 8,
      padding: 15,
      color: '#00ff41',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: '#ff1744', marginBottom: 15 }}>💾 Mejora de Scripts</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 10,
        marginBottom: 15
      }}>
        {Object.entries(scripts).map(([key, script]) => (
          <button
            key={key}
            onClick={() => setSelectedScript(key)}
            style={{
              background: selectedScript === key ? script.color : 'transparent',
              color: selectedScript === key ? '#000' : script.color,
              border: `2px solid ${script.color}`,
              padding: '12px',
              borderRadius: 5,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 13,
              fontFamily: 'monospace',
              transition: 'all 0.3s'
            }}
          >
            {script.name}
            <div style={{ fontSize: 10, marginTop: 5, opacity: 0.7 }}>
              Nivel {player.scripts?.[key]?.level || 0}
            </div>
          </button>
        ))}
      </div>

      {currentScript && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${script.color}`,
          borderRadius: 5,
          padding: 15,
          marginBottom: 15
        }}>
          <h3 style={{ color: script.color, marginBottom: 10 }}>{script.name}</h3>
          <p style={{ marginBottom: 10, fontSize: 13 }}>{script.description}</p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 15
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#888' }}>NIVEL ACTUAL</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: script.color }}>
                {currentScript.level}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#888' }}>COSTE MEJORA</div>
              <div style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: player.credits >= upgradeCost ? '#00ff41' : '#ff1744'
              }}>
                💰 {upgradeCost}
              </div>
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading || player.credits < upgradeCost}
            style={{
              background: player.credits >= upgradeCost ? script.color : '#666',
              color: player.credits >= upgradeCost ? '#000' : '#999',
              border: 'none',
              padding: '12px',
              borderRadius: 5,
              cursor: player.credits >= upgradeCost ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              fontSize: 14,
              fontFamily: 'monospace',
              width: '100%'
            }}
          >
            {loading ? '⏳ Mejorando...' : '📈 MEJORAR SCRIPT'}
          </button>
        </div>
      )}
    </div>
  );
}
