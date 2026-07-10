'use client';
import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { setError(err.message); }
  };

  const handleReset = async () => {
    if (!resetEmail.trim()) return;
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setShowReset(false);
      setError('Correo de recuperación enviado.');
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="login-container">
      <h1 className="neon-text">🔴 RED OSCURA</h1>
      {showReset ? (
        <div>
          <input value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="Email" />
          <button onClick={handleReset}>Enviar recuperación</button>
          <p onClick={() => setShowReset(false)} style={{cursor:'pointer', color:'#00ff41'}}>Volver</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required />
          <button type="submit">{isRegister ? 'Registrarse' : 'Iniciar sesión'}</button>
          <p className="toggle-auth" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </p>
          <p onClick={() => setShowReset(true)} style={{cursor:'pointer', color:'#00ff41'}}>¿Olvidaste tu contraseña?</p>
          {error && <p className="error">{error}</p>}
        </form>
      )}
    </div>
  );
}
