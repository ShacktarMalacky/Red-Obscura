'use client';
import React, { createContext, useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import {doc, onSnapshot} from 'firebase/firestore';
import {ensurePlayer, mine} from '../gameActions';

export const GameContext = createContext();

export function GameProvider({ children }) {
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db || !isFirebaseConfigured) {
      setUser(null);
      setPlayer(null);
      setLoading(false);
      return undefined;
    }

    let unsubPlayer = null;
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubPlayer) {
        unsubPlayer();
        unsubPlayer = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        setPlayer(null);

        if (!firebaseUser.emailVerified) {
          sendEmailVerification(firebaseUser).catch((error) => {
            console.error('Error al enviar verificación de correo:', error);
          });
        }

        ensurePlayer().catch((error) => {
          console.error('Error al inicializar el perfil:', error);
        });

        unsubPlayer = onSnapshot(doc(db, 'jugadores', firebaseUser.uid), (snap) => {
          if (snap.exists()) setPlayer(snap.data());
        });
      } else {
        setUser(null);
        setPlayer(null);
      }

      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubPlayer) unsubPlayer();
    };
  }, []);

  useEffect(() => {
    if (!player || !db || player.scripts?.mineria?.active !== true) return undefined;

    const interval = setInterval(() => {
      mine().catch((error) => {
        if (error?.code !== 'functions/resource-exhausted') {
          console.error('Error de minería:', error);
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [player?.scripts?.mineria?.active, player?.uid]);



  return (
    <GameContext.Provider value={{ user, player, loading }}>
      {children}
    </GameContext.Provider>
  );
}
