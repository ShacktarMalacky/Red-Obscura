'use client';
import React, { useState } from 'react';
import Logout from './Logout';

export default function NavBar({ activeTab, setActiveTab, tabs }) {
  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(22, 33, 62, 0.95), rgba(15, 52, 96, 0.95))',
      border: '2px solid #00ff41',
      borderRadius: 8,
      padding: '15px',
      marginBottom: 15,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10
    }}>
      <div style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        flex: 1
      }}>
        <h1 style={{
          margin: '0 15px 0 0',
          fontSize: 20,
          color: '#ff1744',
          textShadow: '0 0 10px #ff1744'
        }}>
          🔴 RED OSCURA
        </h1>

        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? '#00ff41' : 'transparent',
              color: activeTab === tab.id ? '#000' : '#00ff41',
              border: `2px solid ${activeTab === tab.id ? '#00ff41' : 'rgba(0,255,65,0.3)'}`,
              padding: '8px 15px',
              borderRadius: 5,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 13,
              fontFamily: 'monospace',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => {
              if (activeTab !== tab.id) {
                e.target.style.borderColor = '#00ff41';
                e.target.style.color = '#00ff65';
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== tab.id) {
                e.target.style.borderColor = 'rgba(0,255,65,0.3)';
                e.target.style.color = '#00ff41';
              }
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <Logout />
    </div>
  );
}
