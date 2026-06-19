import { Analytics } from '@vercel/analytics/next';
import { GameProvider } from '../src/context/GameContext';
import '../styles/globals.css';

export const metadata = {
  title: 'Red Oscura',
  description: 'Hacker RPG Game',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <GameProvider>
          {children}
        </GameProvider>
        <Analytics />
      </body>
    </html>
  );
}
