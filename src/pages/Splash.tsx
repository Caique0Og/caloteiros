import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skull } from 'lucide-react';

const Splash = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500);
    const navTimer = setTimeout(() => navigate('/home', { replace: true }), 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  return (
    <div
      className={`min-h-screen bg-background flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="w-24 h-24 rounded-2xl bg-primary/15 flex items-center justify-center neon-glow animate-pulse">
        <Skull className="w-14 h-14 text-primary" />
      </div>
      <h1 className="mt-6 text-4xl font-bold neon-text" style={{ fontFamily: 'var(--font-display)' }}>
        Os Caloteiros
      </h1>
      <p className="mt-2 text-muted-foreground text-sm">Controle de despesas entre amigos</p>
    </div>
  );
};

export default Splash;
