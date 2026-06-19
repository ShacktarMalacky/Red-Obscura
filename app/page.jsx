'use client';
import { useContext } from 'react';
import { GameContext } from '../src/context/GameContext';
import Login from '../src/components/Login';
import Dashboard from '../src/components/Dashboard';

export default function Home() {
  const { user, loading } = useContext(GameContext);

  if (loading) {
    return <div className="loading">Conectando a la Red...</div>;
  }

  return user ? <Dashboard /> : <Login />;
}
