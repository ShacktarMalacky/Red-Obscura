'use client';
import React, { useState, useEffect } from 'react';

export default function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date, timezone) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timezone,
      hour12: false
    }).format(date);
  };

  const timeZones = [
    { name: '🌍 UTC', tz: 'UTC' },
    { name: '🗽 USA (EST)', tz: 'America/New_York' },
    { name: '🇪🇸 España', tz: 'Europe/Madrid' },
    { name: '🇯🇵 Japón', tz: 'Asia/Tokyo' },
    { name: '🇦🇺 Australia', tz: 'Australia/Sydney' },
    { name: '🇧🇷 Brasil', tz: 'America/Sao_Paulo' }
  ];

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
      <h2 style={{ color: '#ff1744', marginBottom: 15, textAlign: 'center' }}>
        🕐 Reloj Global de la Red
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10
      }}>
        {timeZones.map((tz) => (
          <div
            key={tz.tz}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(0, 255, 65, 0.5)',
              borderRadius: 5,
              padding: 12,
              textAlign: 'center',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#00ff41';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 65, 0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(0, 255, 65, 0.5)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
              {tz.name}
            </div>
            <div style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#00ff41',
              letterSpacing: '2px',
              textShadow: '0 0 10px #00ff41'
            }}>
              {formatTime(time, tz.tz)}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 15,
        fontSize: 11,
        color: '#888',
        textAlign: 'center',
        borderTop: '1px solid rgba(0, 255, 65, 0.2)',
        paddingTop: 10
      }}>
        ⏱️ Hora sincronizada en tiempo real
      </div>
    </div>
  );
}
