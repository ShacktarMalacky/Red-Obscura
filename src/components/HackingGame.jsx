'use client';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { GameContext } from '../context/GameContext';
import { db } from '../firebase';
import { doc, runTransaction } from 'firebase/firestore';

// Red-Obscura's network is fictional and entirely simulated in this component.
const SIMULATED_HOSTS = [
  { ip: '10.0.1.2', name: 'archivo-norte', os: 'Linux', user: 'root', difficulty: 1, ports: '22, 80' },
  { ip: '10.0.1.3', name: 'estacion-azul', os: 'Windows', user: 'admin', difficulty: 2, ports: '80, 443' },
  { ip: '10.0.1.6', name: 'nodo-minero', os: 'Linux', user: 'miner', difficulty: 2, ports: '22, 3306' },
  { ip: '10.0.1.7', name: 'relay-admin', os: 'Windows', user: 'admin', difficulty: 2, ports: '22, 443' },
  { ip: '10.0.1.11', name: 'gateway', os: 'Network', user: 'system', difficulty: 4, ports: '53, 443' },
  { ip: '10.0.1.13', name: 'terminal-sur', os: 'Linux', user: 'operator', difficulty: 1, ports: '22, 8080' },
  { ip: '10.0.1.22', name: 'archivo-omega', os: 'Linux', user: 'root', difficulty: 3, ports: '22, 443, 5432' },
];

const INITIAL_LOGS = [
  'RED-OBSCURA // terminal de simulación v1.0',
  'Esta red es ficticia: los comandos no contactan sistemas reales.',
  'Escribe help para ver comandos disponibles.',
];

export default function HackingGame({ nodo, onWin, onFail }) {
  const { player } = useContext(GameContext);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [command, setCommand] = useState('');
  const [discoveredHosts, setDiscoveredHosts] = useState([]);
  const [scanned, setScanned] = useState({});
  const [firewalls, setFirewalls] = useState({});
  const [busy, setBusy] = useState(false);
  const logEndRef = useRef(null);
  const nodeName = nodo?.name || nodo?.nombre || 'Nodo desconocido';
  const nodeDifficulty = Math.max(1, Math.ceil((nodo?.defense || nodo?.seguridad || 10) / 25));

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [logs]);

  const addLog = (line) => setLogs((current) => [...current, line].slice(-60));
  const firewallFor = (host) => firewalls[host.ip] ?? (15 + host.difficulty * 10 + nodeDifficulty * 3);

  const execute = async (rawCommand) => {
    const input = rawCommand.trim();
    if (!input || busy) return;
    addLog(`> ${input}`);
    setCommand('');
    const [verb, ...args] = input.toLowerCase().split(/\s+/);
    const arg = args.join(' ');

    if (verb === 'help') {
      addLog('Comandos: help, status, range 10.0.1.1-30, hosts, scan <IP>, attack <IP>, clear');
      addLog('Flujo: range → hosts → scan IP → attack IP. Cada intento cuesta 10 CR.');
      return;
    }
    if (verb === 'clear') {
      setLogs([]);
      return;
    }
    if (verb === 'status') {
      addLog(`PC ONLINE | jugador: ${player?.username || 'hacker'} | RAM: ${player?.ram ?? 4} GB | créditos: ${player?.credits ?? 0} CR`);
      addLog(`Objetivo: ${nodeName} | seguridad: ${nodo?.defense ?? nodo?.seguridad ?? 'desconocida'}`);
      return;
    }
    if (verb === 'range') {
      const match = arg.match(/^10\.0\.1\.(\d{1,3})-(\d{1,3})$/);
      if (!match) {
        addLog('Sintaxis: range 10.0.1.1-30');
        return;
      }
      const start = Number(match[1]);
      const end = Number(match[2]);
      if (start < 1 || end > 254 || start > end || end - start > 253) {
        addLog('Rango inválido. Usa direcciones 10.0.1.1-254.');
        return;
      }
      const found = SIMULATED_HOSTS.filter((host) => {
        const lastOctet = Number(host.ip.split('.').at(-1));
        return lastOctet >= start && lastOctet <= end;
      });
      setDiscoveredHosts(found);
      addLog(`Escaneo simulado completado: ${end - start + 1} direcciones revisadas; ${found.length} hosts ficticios encontrados.`);
      addLog('Usa hosts para consultar los objetivos disponibles.');
      return;
    }
    if (verb === 'hosts') {
      if (discoveredHosts.length === 0) {
        addLog('Primero inicia el descubrimiento con: range 10.0.1.1-30');
        return;
      }
      discoveredHosts.forEach((host) => {
        addLog(`${host.ip}  ${host.name.padEnd(16)} ${host.os.padEnd(8)} dificultad ${host.difficulty}${scanned[host.ip] ? ' | inspeccionado' : ''}`);
      });
      return;
    }
    if (verb === 'scan') {
      if (discoveredHosts.length === 0) {
        addLog('No hay hosts descubiertos. Ejecuta primero: range 10.0.1.1-30');
        return;
      }
      const host = discoveredHosts.find((item) => item.ip === arg);
      if (!host) {
        addLog('Host no encontrado en esta red simulada. Ejecuta hosts y copia una IP de la lista.');
        return;
      }
      setScanned((current) => ({ ...current, [host.ip]: true }));
      addLog(`HOST FOUND: ${host.ip} (${host.name})`);
      addLog(`OS: ${host.os} | usuario simulado: ${host.user} | puertos: ${host.ports}`);
      addLog(`Firewall: ${firewallFor(host)} puntos | protección estimada: ${host.difficulty}/5`);
      addLog(`Para intentar el acceso: attack ${host.ip}`);
      return;
    }
    if (verb === 'attack') {
      if (discoveredHosts.length === 0) {
        addLog('No hay hosts descubiertos. Ejecuta primero: range 10.0.1.1-30');
        return;
      }
      const host = discoveredHosts.find((item) => item.ip === arg);
      if (!host) {
        addLog('Host no encontrado. Ejecuta hosts y usa una IP de la lista.');
        return;
      }
      if (!scanned[host.ip]) {
        addLog(`Debes inspeccionar ${host.ip} primero: scan ${host.ip}`);
        return;
      }
      if (!db || !player?.uid) {
        addLog('No se pudo guardar el intento: falta conexión al perfil del juego.');
        return;
      }
      setBusy(true);
      try {
        await runTransaction(db, async (transaction) => {
          const playerRef = doc(db, 'jugadores', player.uid);
          const playerSnap = await transaction.get(playerRef);
          if (!playerSnap.exists()) throw new Error('No se encontró tu perfil de jugador.');
          const credits = Number(playerSnap.data().credits || 0);
          if (credits < 10) throw new Error('Te faltan créditos: cada intento cuesta 10 CR.');
          transaction.update(playerRef, { credits: credits - 10 });
        });
      } catch (error) {
        addLog(error?.message || 'No se pudo descontar el coste del intento.');
        setBusy(false);
        return;
      }

      const remaining = firewallFor(host);
      const attackLevel = player?.scripts?.ataque?.level || 0;
      const damage = Math.max(8, 13 + attackLevel * 4 + Math.floor(Math.random() * 8) - host.difficulty * 2 - nodeDifficulty);
      const nextFirewall = Math.max(0, remaining - damage);
      setFirewalls((current) => ({ ...current, [host.ip]: nextFirewall }));
      addLog(`Exploit simulado contra ${host.ip}: -${damage} firewall (${nextFirewall} restantes). -10 CR.`);

      if (nextFirewall === 0) {
        addLog(`ACCESO CONSEGUIDO: ${host.name}. Reclamando ${nodeName}...`);
        try {
          await onWin?.({ host, nodo });
          addLog('Nodo conquistado. Recompensas añadidas al perfil.');
        } catch (error) {
          addLog(error?.message || 'El host fue superado, pero no se pudo guardar la conquista.');
          setBusy(false);
          return;
        }
      }
      setBusy(false);
      return;
    }
    addLog(`Comando desconocido: ${verb}. Escribe help.`);
  };

  return (
    <section style={{ background: '#080d18', border: '1px solid #00ff41', borderRadius: 8, padding: 14, color: '#b9ffca', fontFamily: 'monospace' }} aria-label="Terminal simulada de Red-Obscura">
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ color: '#00ff41', margin: '0 0 4px' }}>⌨ Terminal de intrusión simulada</h3>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>Objetivo: {nodeName} · {player?.credits ?? 0} CR</div>
        </div>
        <button type="button" onClick={onFail} disabled={busy} style={{ padding: '8px 12px', cursor: busy ? 'wait' : 'pointer' }}>Volver al mapa</button>
      </header>
      <div role="note" style={{ margin: '12px 0', padding: 9, border: '1px solid #52606d', borderRadius: 5, color: '#b6c8d6', fontSize: 12 }}>
        Simulación ficticia dentro del juego; no se conecta a Internet ni a dispositivos reales. Cada ataque cuesta 10 CR.
      </div>
      <div role="log" aria-live="polite" style={{ height: 280, overflowY: 'auto', background: '#020508', border: '1px solid #1f5134', padding: 10, borderRadius: 5, fontSize: 12, lineHeight: 1.55, overflowWrap: 'anywhere' }}>
        {logs.map((line, index) => <div key={`${index}-${line}`} style={{ color: line.startsWith('>') ? '#fff' : line.includes('ERROR') ? '#ff8585' : '#a7f3b6' }}>{line}</div>)}
        <div ref={logEndRef} />
      </div>
      <form onSubmit={(event) => { event.preventDefault(); execute(command); }} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <label htmlFor="red-obscura-command" style={{ alignSelf: 'center', color: '#00ff41' }}>root@red-obscura:~$</label>
        <input id="red-obscura-command" value={command} onChange={(event) => setCommand(event.target.value)} disabled={busy} autoComplete="off" spellCheck="false" aria-label="Comando de terminal" style={{ flex: 1, minWidth: 0, background: '#020508', color: '#fff', border: '1px solid #00ff41', borderRadius: 4, padding: 9, fontFamily: 'monospace' }} />
        <button type="submit" disabled={busy || !command.trim()} style={{ padding: '8px 12px', cursor: busy ? 'wait' : 'pointer' }}>{busy ? '...' : 'Ejecutar'}</button>
      </form>
      {nodo?.owner === player?.uid && <p style={{ color: '#ffd166', fontSize: 12 }}>Este nodo ya está bajo tu control; completar otra intrusión no dará recompensa.</p>}
    </section>
  );
}
