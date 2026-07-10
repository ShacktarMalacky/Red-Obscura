import { GameProvider } from '../context/GameContext';
import '../styles/globals.css';

export const metadata = {
  title: '🔴 Red-Obscura - RPG Hacker Multiplayer',
  description: 'Juega como hacker en la Red Oscura, compite, forma clanes y conquista nodos',
  keywords: 'RPG, Hacker, Multijugador, Firebase, Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>🔴</text></svg>" />
      </head>
      <body>
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}