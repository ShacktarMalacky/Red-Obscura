export default function Home() {
  return (
    <div style={{ 
      backgroundColor: '#1a1a1a', 
      color: 'red', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      fontFamily: 'sans-serif' 
    }}>
      <h1 style={{ fontSize: '3rem', textShadow: '0 0 10px red' }}>🔴 RED OBSCURA 🔴</h1>
      <p style={{ fontSize: '1.2rem' }}>Servidor estable en Termux</p>
      <p style={{ color: 'gray' }}>ShacktarMalacky - Developer</p>
    </div>
  );
}
