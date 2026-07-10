'use client';
import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';

export const GameContext = createContext();

export function GameProvider({ children }) {
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        if (!firebaseUser.emailVerified) sendEmailVerification(firebaseUser);
        const unsubPlayer = onSnapshot(doc(db, 'jugadores', firebaseUser.uid), (snap) => {
          if (snap.exists()) setPlayer(snap.data());
          else {
            const newPlayer = {
              uid: firebaseUser.uid,
              username: `Hacker_${Math.floor(Math.random() * 10000)}`,
              level: 1, xp: 0, credits: 100, clan: null,
              scripts: {
                mineria: { level: 1, active: true },
                defensa: { level: 0, active: false },
                ataque: { level: 0, active: false }
              },
              createdAt: Date.now()
            };
            setDoc(doc(db, 'jugadores', firebaseUser.uid), newPlayer).then(() => setPlayer(newPlayer));
          }
        });
        setLoading(false);
        return () => unsubPlayer();
      } else {
        setUser(null);
        setPlayer(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // Minería automática (solo en el cliente)
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(async () => {
      const nivel = player.scripts?.mineria?.level || 1;
      const activo = player.scripts?.mineria?.active;
      if (!activo) return;
      await updateDoc(doc(db, 'jugadores', player.uid), {
        xp: increment(1 * nivel),
        credits: increment(2 * nivel)
      });
      await addDoc(collection(db, 'mensajes'), {
        channel: 'global', user: 'Sistema',
        text: `${player.username} ha minado datos (+${nivel} XP, +${2*nivel} créditos).`,
        timestamp: Date.now(), uid: 'sistema'
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [player?.scripts?.mineria?.active, player?.scripts?.mineria?.level, player?.uid]);

  const updatePlayer = async (updates) => {
    if (!user) return;
    await updateDoc(doc(db, 'jugadores', user.uid), updates);
  };

  return (
    <GameContext.Provider value={{ user, player, loading, updatePlayer }}>
      {children}
    </GameContext.Provider>
  );
}
