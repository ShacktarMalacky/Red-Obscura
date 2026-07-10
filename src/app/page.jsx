'use client';
import React, { useContext } from 'react';
import { GameContext, GameProvider } from '../context/GameContext';
import Login from '../components/Login';
import Dashboard from '../components/Dashboard';

function PageContent() {
  const { user, loading } = useContext(GameContext);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0e27 0%, #16213e 100%)',
        color: '#00ff41',
        fontSize: 20,
        fontFamily: 'monospace'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 48, marginBottom: 20 }}>🔴 RED OSCURA</h1>
          <p style={{ marginTop: 20 }}>Conectando a la Red...</p>
          <div style={{ marginTop: 20, fontSize: 30, animation: 'spin 1s linear infinite' }}>
            ⟳
          </div>
          <style>{
            `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`
          }</style>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Login />;
}

export default function Home() {
  return (
    <GameProvider>
      <PageContent />
    </GameProvider>
  );
}