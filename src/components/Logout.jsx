'use client';
import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Logout() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        background: '#ff1744',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: 5,
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: 14,
        fontFamily: 'monospace'
      }}
      onMouseEnter={e => e.target.style.background = '#ff5252'}
      onMouseLeave={e => e.target.style.background = '#ff1744'}
    >
      🚪 Cerrar sesión
    </button>
  );
}
