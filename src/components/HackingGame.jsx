'use client';
import React, { useState, useEffect, useContext } from 'react';
import { GameContext } from '../context/GameContext';

export default function HackingGame({ nodo, onWin, onFail }) {
  const { player, updatePlayer } = useContext(GameContext);
  const [gameState, setGameState] = useState('playing'); // playing, won, lost
  const [health, setHealth] = useState(100);
  const [firewall, setFirewall] = useState(nodo?.seguridad * 10 || 50);
  const [time, setTime] = useState(30);
  const [score, setScore] = useState(0);
  const [logs, setLogs] = useState(['Sistema iniciado...', 'Conectando...']);

  // Timer para el juego
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          setGameState('lost');
          addLog('⚠️ ¡Tiempo agotado!');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState]);

  // Auto-ataque del firewall
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      const dmg = Math.floor(Math.random() * 5) + 2;
      setHealth(h => {
        const newHealth = h - dmg;
        if (newHealth <= 0) {
          setGameState('lost');
          addLog(`💥 Firewall contraataque: -${dmg} HP. Game Over!`);
          return 0;
        }
        addLog(`⚡ Firewall contraataque: -${dmg} HP`);
        return newHealth;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, [gameState]);

  const addLog = (msg) => {
    setLogs(l => [...l, msg].slice(-6));
  };

  const attack = () => {
    if (gameState !== 'playing') return;
    
    const dmg = Math.floor(Math.random() * 15) + 10;
    const newFirewall = firewall - dmg;
    
    setFirewall(newFirewall);
    setScore(s => s + dmg);
    addLog(`🔓 Exploit ejecutado: -${dmg} firewall`);

    if (newFirewall <= 0) {
      setGameState('won');
      addLog('✅ ¡Firewall neutralizado! ¡Victoria!');
    }
  };

  const defend = () => {
    if (gameState !== 'playing') return;
    
    const heal = 15;
    setHealth(h => Math.min(100, h + heal));
    addLog(`🛡️ Firewall defensivo activado: +${heal} HP`);
  };

  const scan = () => {
    if (gameState !== 'playing') return;
    
    const info = `Firewall: ${Math.max(0, firewall)}/${nodo?.seguridad * 10 || 50}`;
    addLog(`📡 Escaneo: ${info}`);
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0e27 0%, #16213e 100%)',
      border: '3px solid #00ff41',
      borderRadius: 10,
      padding: 20,
      color: '#00ff41',
      fontFamily: 'monospace',
      maxWidth: 500,
      margin: '0 auto'
    }}>
      {/* Header */}
      <h2 style={{ textAlign: 'center', marginTop: 0, color: '#ff1744' }}>
        🔴 MINIJUEGO DE HACKING
      </h2>
      <p style={{ textAlign: 'center', fontSize: 12 }}>
        Objetivo: {nodo?.nombre || 'Nodo Desconocido'} | Seguridad: {nodo?.seguridad || 'N/A'}
      </p>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: 15,
        fontSize: 13
      }}>
        <div style={{ background: 'rgba(0,255,65,0.1)', padding: 10, borderRadius: 5 }}>
          <div>❤️ HP: {Math.max(0, health)}/100</div>
          <div style={{
            background: 'rgba(255,0,0,0.3)',
            height: 6,
            borderRadius: 3,
            marginTop: 5,
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#00ff41',
              height: '100%',
              width: `${Math.max(0, health)}%`,
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
        
        <div style={{ background: 'rgba(0,255,65,0.1)', padding: 10, borderRadius: 5 }}>
          <div>🔥 Firewall: {Math.max(0, firewall)}</div>
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            height: 6,
            borderRadius: 3,
            marginTop: 5,
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#ff1744',
              height: '100%',
              width: `${Math.max(0, Math.min(100, (firewall / (nodo?.seguridad * 10 || 50)) * 100))}%`,
              transition: 'width 0.3s'
            }} />
          </div>
        </div>

        <div style={{ background: 'rgba(0,255,65,0.1)', padding: 10, borderRadius: 5 }}>
          <div>⏱️ Tiempo: {time}s</div>
        </div>

        <div style={{ background: 'rgba(0,255,65,0.1)', padding: 10, borderRadius: 5 }}>
          <div>⭐ Score: {score}</div>
        </div>
      </div>

      {/* Terminal Log */}
      <div style={{
        background: 'rgba(0,0,0,0.5)',
        border: '1px solid #00ff41',
        borderRadius: 5,
        padding: 10,
        height: 120,
        overflowY: 'auto',
        marginBottom: 15,
        fontSize: 11,
        lineHeight: '1.4'
      }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      {/* Controles */}
      {gameState === 'playing' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 10
        }}>
          <button
            onClick={attack}
            style={{
              background: '#ff1744',
              color: 'white',
              border: 'none',
              padding: '12px 15px',
              borderRadius: 5,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 12,
              fontFamily: 'monospace'
            }}
            onMouseEnter={e => e.target.style.background = '#ff5252'}
            onMouseLeave={e => e.target.style.background = '#ff1744'}
          >
            ⚔️ ATACAR
          </button>
          
          <button
            onClick={defend}
            style={{
              background: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '12px 15px',
              borderRadius: 5,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 12,
              fontFamily: 'monospace'
            }}
            onMouseEnter={e => e.target.style.background = '#42A5F5'}
            onMouseLeave={e => e.target.style.background = '#2196F3'}
          >
            🛡️ DEFENDER
          </button>

          <button
            onClick={scan}
            style={{
              background: '#FFA000',
              color: 'white',
              border: 'none',
              padding: '12px 15px',
              borderRadius: 5,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 12,
              fontFamily: 'monospace',
              gridColumn: '1 / -1'
            }}
            onMouseEnter={e => e.target.style.background = '#FFB74D'}
            onMouseLeave={e => e.target.style.background = '#FFA000'}
          >
            📡 ESCANEAR
          </button>
        </div>
      ) : null}

      {/* Game Over */}
      {gameState === 'won' && (
        <div style={{
          background: 'rgba(76,175,80,0.2)',
          border: '2px solid #4CAF50',
          borderRadius: 5,
          padding: 15,
          textAlign: 'center',
          marginBottom: 10
        }}>
          <h3 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>✅ ¡VICTORIA!</h3>
          <p style={{ margin: 5 }}>Nodo conquistado exitosamente</p>
          <p style={{ margin: 5 }}>Score final: {score}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <button
              onClick={onWin}
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Continuar
            </button>
            <button
              onClick={onFail}
              style={{
                background: '#757575',
                color: 'white',
                border: 'none',
                padding: '10px',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Volver
            </button>
          </div>
        </div>
      )}

      {gameState === 'lost' && (
        <div style={{
          background: 'rgba(244,67,54,0.2)',
          border: '2px solid #F44336',
          borderRadius: 5,
          padding: 15,
          textAlign: 'center',
          marginBottom: 10
        }}>
          <h3 style={{ color: '#F44336', margin: '0 0 10px 0' }}>❌ DERROTA</h3>
          <p style={{ margin: 5 }}>Firewall neutralizó tu intento</p>
          <p style={{ margin: 5 }}>Score: {score}</p>
          <button
            onClick={onFail}
            style={{
              background: '#F44336',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: 10,
              width: '100%'
            }}
          >
            Volver al Mapa
          </button>
        </div>
      )}

      {/* Info */}
      <p style={{ fontSize: 11, textAlign: 'center', color: '#888', margin: '10px 0 0 0' }}>
        💡 Tip: Alterna entre ataque y defensa para sobrevivir
      </p>
    </div>
  );
}
