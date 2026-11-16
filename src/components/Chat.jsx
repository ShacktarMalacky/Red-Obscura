'use client';
import React, { useState, useEffect, useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { db } from '../firebase';
import {collection, onSnapshot, query, orderBy, limitToLast, where} from 'firebase/firestore';
import {sendChat} from '../gameActions';

export default function Chat() {
  const { player } = useContext(GameContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [channel, setChannel] = useState('global');

  useEffect(() => {
    let q;
    if (channel === 'global') q = query(collection(db, 'mensajes'), where('channel', '==', 'global'), orderBy('timestamp', 'asc'), limitToLast(50));
    else if (channel === 'clan' && player?.clan) q = query(collection(db, 'mensajes'), where('channel', '==', `clan_${player.clan}`), orderBy('timestamp', 'asc'), limitToLast(50));
    else q = query(collection(db, 'mensajes'), where('channel', '==', 'global'), orderBy('timestamp', 'asc'), limitToLast(50));
    const unsub = onSnapshot(q, (snap) => setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
    return () => unsub();
  }, [channel, player?.clan]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !player) return;
    if (text.startsWith('/') && text !== '/roll') {
      setInput('');
      return;
    }
    try {
      await sendChat(text, channel === 'clan' && player.clan ? `clan_${player.clan}` : 'global');
      setInput('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
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
