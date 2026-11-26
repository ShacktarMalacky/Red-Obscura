'use client';
import React, { useState, useEffect, useContext } from 'react';
import { GameContext } from '../context/GameContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, runTransaction } from 'firebase/firestore';
import HackingGame from './HackingGame';

// Nodos iniciales de la Red Oscura. Se siembran en Firestore la primera vez.
const NODOS_INICIALES = [
  { id: 'nodo-alfa', name: 'Nodo Alfa', defense: 10, reward: 50, x: 15, y: 20 },
  { id: 'nodo-beta', name: 'Nodo Beta', defense: 25, reward: 90, x: 55, y: 15 },
  { id: 'nodo-gamma', name: 'Nodo Gamma', defense: 40, reward: 140, x: 80, y: 35 },
  { id: 'nodo-delta', name: 'Nodo Delta', defense: 60, reward: 210, x: 30, y: 55 },
  { id: 'nodo-omega', name: 'Nodo Omega', defense: 100, reward: 400, x: 65, y: 70 },
];

export default function Mapa() {
  const { player } = useContext(GameContext);
  const [nodos, setNodos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [terminalAbierta, setTerminalAbierta] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'nodos'), async (snap) => {
      if (snap.empty) {
        await Promise.all(
          NODOS_INICIALES.map((n) => setDoc(doc(db, 'nodos', n.id), {
            name: n.name,
            defense: n.defense,
            reward: n.reward,
            x: n.x,
            y: n.y,
            owner: null,
            ownerName: null,
          }))
        );
        return;
      }
      setNodos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const conquistarConTerminal = async () => {
    if (!player?.uid || !seleccionado) throw new Error('No se pudo verificar tu perfil o el nodo seleccionado.');
    if (!db) throw new Error('No hay conexión con la base de datos del juego.');

    const playerRef = doc(db, 'jugadores', player.uid);
    const nodeRef = doc(db, 'nodos', seleccionado.id);
    const result = await runTransaction(db, async (transaction) => {
      const playerSnap = await transaction.get(playerRef);
      const nodeSnap = await transaction.get(nodeRef);
      if (!playerSnap.exists() || !nodeSnap.exists()) throw new Error('No se encontró el perfil o el nodo.');
      const currentPlayer = playerSnap.data();
      const currentNode = nodeSnap.data();
      if (currentNode.owner === player.uid) return { alreadyOwned: true };

      const credits = Number(currentPlayer.credits || 0);
      const xp = Number(currentPlayer.xp || 0);
      const defense = Number(currentNode.defense || seleccionado.defense || 0);
      const reward = Math.max(0, Number(currentNode.reward || seleccionado.reward || 0) - 10);
      transaction.update(nodeRef, {
        owner: player.uid,
        ownerName: currentPlayer.username || player.username || 'Hacker',
        defense: defense + 5,
      });
      transaction.update(playerRef, {
        credits: credits + reward,
        xp: xp + defense,
      });
      return { reward, xp: defense, name: currentNode.name || seleccionado.name };
    });

    if (result.alreadyOwned) {
      setMensaje('Este nodo ya está bajo tu control; no se otorgó otra recompensa.');
      return;
    }
    setMensaje(`¡Conquista completada: ${result.name}! +${result.reward} créditos netos y +${result.xp} XP.`);
    setTerminalAbierta(false);
  };

  const nodosPropios = nodos.filter((n) => n.owner === player?.uid).length;

  return (
    <div className="panel">
      <h2>🗺️ Mapa de la Red Oscura</h2>
      <p style={{ marginBottom: 10, fontSize: 13 }}>
        Elige un nodo y supera su terminal simulada para conquistarlo. Nodos bajo tu control:{' '}
        <strong style={{ color: '#ff1744' }}>{nodosPropios}</strong>
      </p>

      {mensaje && (
        <div role="status" style={{ background: 'rgba(0, 255, 65, 0.1)', border: '1px solid #00ff41', padding: 10, borderRadius: 5, marginBottom: 12, fontSize: 12 }}>
          {mensaje}
        </div>
      )}

      {!terminalAbierta && <>
        <div style={{ position: 'relative', width: '100%', height: 260, background: 'rgba(10, 14, 39, 0.6)', border: '1px solid rgba(0, 255, 65, 0.4)', borderRadius: 8, marginBottom: 15, overflow: 'hidden' }}>
          {nodos.map((nodo) => {
            const propio = nodo.owner === player?.uid;
            const ocupado = nodo.owner && !propio;
            const color = propio ? '#00ff41' : ocupado ? '#ff1744' : '#7dd3fc';
            return (
              <button
                key={nodo.id}
                type="button"
                onClick={() => { setSeleccionado(nodo); setMensaje(''); }}
                title={nodo.name}
                style={{ position: 'absolute', left: `${nodo.x}%`, top: `${nodo.y}%`, transform: 'translate(-50%, -50%)', width: 22, height: 22, borderRadius: '50%', background: color, border: seleccionado?.id === nodo.id ? '3px solid #fff' : `2px solid ${color}`, boxShadow: `0 0 12px ${color}`, cursor: 'pointer', padding: 0 }}
                aria-label={`Nodo ${nodo.name}`}
              />
            );
          })}
        </div>

        {seleccionado ? (
          <div style={{ border: '1px solid rgba(0, 255, 65, 0.4)', borderRadius: 6, padding: 12 }}>
            <h3 style={{ marginBottom: 8 }}>{seleccionado.name}</h3>
            <p style={{ fontSize: 13, marginBottom: 4 }}>🛡️ Defensa: {seleccionado.defense}</p>
            <p style={{ fontSize: 13, marginBottom: 4 }}>💰 Recompensa base: {seleccionado.reward}</p>
            <p style={{ fontSize: 13, marginBottom: 10 }}>👤 Controlado por: {seleccionado.owner ? (seleccionado.owner === player?.uid ? 'Ti' : seleccionado.ownerName || 'otro hacker') : 'Nadie'}</p>
            {seleccionado.owner === player?.uid ? (
              <button type="button" disabled style={{ width: '100%' }}>Nodo controlado por ti</button>
            ) : (
              <button type="button" onClick={() => { setMensaje(''); setTerminalAbierta(true); }} style={{ width: '100%' }}>
                ⌨ Abrir terminal simulada
              </button>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 13, opacity: 0.8 }}>Selecciona un nodo del mapa para ver sus detalles.</p>
        )}
      </>}

      {terminalAbierta && seleccionado && (
        <HackingGame nodo={seleccionado} onWin={conquistarConTerminal} onFail={() => setTerminalAbierta(false)} />
      )}
    </div>
  );
}
