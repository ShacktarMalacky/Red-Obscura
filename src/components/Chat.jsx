'use client';
import React, { useState, useEffect, useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';

export default function Chat() {
  const { player } = useContext(GameContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [channel, setChannel] = useState('global');

  useEffect(() => {
    let q;
    if (channel === 'global') q = query(collection(db, 'mensajes'), where('channel', '==', 'global'), orderBy('timestamp', 'asc'), limit(50));
    else if (channel === 'clan' && player?.clan) q = query(collection(db, 'mensajes'), where('channel', '==', `clan_${player.clan}`), orderBy('timestamp', 'asc'), limit(50));
    else q = query(collection(db, 'mensajes'), where('channel', '==', 'global'), orderBy('timestamp', 'asc'), limit(50));
    const unsub = onSnapshot(q, (snap) => setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => unsub();
  }, [channel, player?.clan]);

  const sendMessage = async () => {
    if (!input.trim() || !player) return;
    if (input.startsWith('/')) {
      const parts = input.split(' ');
      if (parts[0] === '/roll') {
        const dice = Math.floor(Math.random() * 20) + 1;
        await addDoc(collection(db, 'mensajes'), { channel, user: 'Sistema', text: `${player.username} ha sacado un ${dice} en 1d20.`, timestamp: Date.now(), uid: 'sistema' });
        setInput(''); return;
      }
    }
    await addDoc(collection(db, 'mensajes'), { channel, user: player.username, text: input, timestamp: Date.now(), uid: player.uid });
    setInput('');
  };

  return (
    <div className="panel">
      <h2>💬 Chat {channel === 'global' ? 'Global' : 'Clan'}</h2>
      <select value={channel} onChange={e => setChannel(e.target.value)} style={{background:'#111', color:'#00ff41', border:'1px solid #00ff41', marginBottom:5}}>
        <option value="global">Global</option>
        {player?.clan && <option value="clan">Clan</option>}
      </select>
      <div className="chat-messages">
        {messages.map(msg => (
          <p key={msg.id}><strong style={{color: msg.uid === player?.uid ? '#ffcc00' : '#00ff41'}}>{msg.user}:</strong> {msg.text}</p>
        ))}
      </div>
      <div className="chat-input">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe... (/roll)" onKeyDown={e => e.key === 'Enter' && sendMessage()} />
        <button onClick={sendMessage}>Enviar</button>
      </div>
    </div>
  );
}
