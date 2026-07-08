'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export default function LeaderBoard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('level');

  useEffect(() => {
    let queryConstraints = [orderBy(sortBy, 'desc'), limit(10)];
    const q = query(collection(db, 'jugadores'), ...queryConstraints);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlayers(snapshot.docs.map((doc, idx) => ({
        rank: idx + 1,
        ...doc.data()
      })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sortBy]);

  const getSortIcon = (field) => sortBy === field ? '▼' : '○';

  return (
    <div style={{
      background: 'rgba(22, 33, 62, 0.9)',
      border: '2px solid #00ff41',
      borderRadius: 8,
      padding: 15,
      color: '#00ff41',
      fontFamily: 'monospace'
    }}>
      <h2 style={{ color: '#ff1744', marginBottom: 15 }}>🏆 Ranking Global</h2>

      <div style={{
        display: 'flex',
        gap: 10,
        marginBottom: 15
      }}>
        {['level', 'credits', 'xp'].map(field => (
          <button
            key={field}
            onClick={() => setSortBy(field)}
            style={{
              background: sortBy === field ? '#00ff41' : 'transparent',
              color: sortBy === field ? '#000' : '#00ff41',
              border: `1px solid #00ff41`,
              padding: '8px 12px',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'monospace'
            }}
          >
            {field === 'level' && '⭐ Nivel'}
            {field === 'credits' && '💰 Créditos'}
            {field === 'xp' && '📊 XP'}
            {' ' + getSortIcon(field)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
          Cargando ranking...
        </div>
      ) : players.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
          No hay jugadores registrados
        </div>
      ) : (
        <div>
          {players.map((player) => (
            <div
              key={player.uid}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 100px 100px 100px',
                gap: 10,
                padding: '10px',
                borderBottom: '1px solid rgba(0, 255, 65, 0.2)',
                alignItems: 'center',
                fontSize: 13
              }}
            >
              <div style={{
                fontWeight: 'bold',
                color: player.rank === 1 ? '#FFD700' : player.rank === 2 ? '#C0C0C0' : player.rank === 3 ? '#CD7F32' : '#00ff41'
              }}>
                #{player.rank}
              </div>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {player.username}
              </div>
              <div style={{ textAlign: 'right' }}>⭐ {player.level}</div>
              <div style={{ textAlign: 'right', color: '#FFD700' }}>💰 {player.credits}</div>
              <div style={{ textAlign: 'right' }}>📊 {player.xp}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
