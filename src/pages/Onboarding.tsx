import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Receipt, TrendingUp, CheckCircle } from 'lucide-react';

const slides = [
  {
    icon: Users,
    title: 'Crie grupos',
    description: 'Adicione seus amigos e organize despesas por viagem, moradia ou qualquer ocasião.',
  },
  {
    icon: Receipt,
    title: 'Registre despesas',
    description: 'Adicione gastos e o app divide automaticamente entre os membros do grupo.',
  },
  {
    icon: TrendingUp,
    title: 'Acompanhe saldos',
    description: 'Veja quem deve quanto e para quem, em tempo real.',
  },
  {
    icon: CheckCircle,
    title: 'Acerte as contas',
    description: 'Liquide dívidas com um toque e mantenha tudo em dia.',
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);

  const isLast = current === slides.length - 1;
  const slide = slides[current];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center neon-glow mb-8">
          <Icon className="w-10 h-10 text-primary" />
        </div>

        <h2 className="text-2xl font-bold mb-3">{slide.title}</h2>
        <p className="text-muted-foreground mb-10 leading-relaxed">{slide.description}</p>

        {/* Dots */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-primary' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex w-full gap-3">
          {!isLast && (
            <Button
              variant="ghost"
              className="flex-1"
      onClick={() => navigate('/app', { replace: true })}
            >
              Pular
            </Button>
          )}
          <Button
            className="flex-1"
            onClick={() => {
              if (isLast) {
                navigate('/app', { replace: true });
              } else {
                setCurrent((c) => c + 1);
              }
            }}
          >
            {isLast ? 'Começar!' : 'Próximo'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
