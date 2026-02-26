import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Skull,
  Users,
  Receipt,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Smartphone,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Grupos fáceis',
    description: 'Crie grupos por viagem, moradia ou qualquer ocasião e adicione amigos em segundos.',
  },
  {
    icon: Receipt,
    title: 'Divisão automática',
    description: 'Registre despesas e o app divide igualmente entre todos os membros do grupo.',
  },
  {
    icon: TrendingUp,
    title: 'Saldos em tempo real',
    description: 'Veja quem deve quanto e para quem, atualizado a cada nova despesa.',
  },
  {
    icon: CheckCircle,
    title: 'Acerte as contas',
    description: 'Liquide dívidas com um toque e mantenha o histórico organizado.',
  },
  {
    icon: Zap,
    title: 'Super rápido',
    description: 'Interface pensada para o celular. Registre uma despesa em menos de 10 segundos.',
  },
  {
    icon: Shield,
    title: 'Seguro e confiável',
    description: 'Seus dados são protegidos com criptografia de ponta e autenticação moderna.',
  },
];

const steps = [
  { number: '01', title: 'Crie sua conta', description: 'Cadastre-se com email ou Google em menos de um minuto.' },
  { number: '02', title: 'Monte seu grupo', description: 'Convide amigos e dê um nome para o grupo (ex: "Viagem a Cancún").' },
  { number: '03', title: 'Registre despesas', description: 'Adicione gastos e o app cuida da matemática automaticamente.' },
  { number: '04', title: 'Acerte as contas', description: 'Na hora de pagar, veja exatamente quem deve o quê.' },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Skull className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-sm neon-text">Os Caloteiros</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate('/login')} className="gap-1">
              Começar grátis <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-20 px-6 text-center relative">
        {/* Background glow */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)' }}
        />

        <div className="relative max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
            <Smartphone className="w-3 h-3" />
            Feito para quem divide tudo com os amigos
          </div>

          <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center neon-glow mx-auto mb-6">
            <Skull className="w-11 h-11 text-primary" />
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-4 neon-text" style={{ fontFamily: 'var(--font-display)' }}>
            Os Caloteiros
          </h1>
          <p className="text-xl text-muted-foreground mb-3 leading-relaxed">
            Chega de confusão na hora de dividir a conta.
          </p>
          <p className="text-base text-muted-foreground mb-10 leading-relaxed max-w-lg mx-auto">
            Gerencie despesas em grupo, veja quem deve quem e acerte as contas — tudo em um app simples e rápido.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="w-full sm:w-auto gap-2 px-8" onClick={() => navigate('/login')}>
              Criar conta grátis <ArrowRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/login')}>
              Já tenho conta
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">Grátis para sempre · Sem cartão de crédito</p>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 px-6 border-y border-border/50">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { value: '100%', label: 'Gratuito' },
            { value: '< 10s', label: 'Para registrar uma despesa' },
            { value: '∞', label: 'Grupos e despesas' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-primary mb-1">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Tudo que você precisa</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Simples de usar, poderoso o suficiente para qualquer situação.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="glass-card p-6 hover:border-primary/30 transition-all duration-200 hover:shadow-md"
                  style={{ boxShadow: '0 2px 16px hsl(var(--primary) / 0.04)' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 bg-card/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Como funciona</h2>
            <p className="text-muted-foreground">Comece a usar em menos de 2 minutos.</p>
          </div>

          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={s.number} className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center neon-glow">
                  <span className="text-primary font-bold text-sm font-mono">{s.number}</span>
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute ml-6 mt-14 w-px h-6 bg-border/50" style={{ position: 'absolute', display: 'none' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.08) 0%, transparent 70%)' }}
        />
        <div className="relative max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center neon-glow mx-auto mb-6">
            <Skull className="w-9 h-9 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-3">Pronto para acabar com a bagunça?</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Crie sua conta grátis e comece a dividir despesas de forma justa com seus amigos agora mesmo.
          </p>
          <Button size="lg" className="gap-2 px-10" onClick={() => navigate('/login')}>
            Começar agora <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">Sem pegadinhas. 100% gratuito.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
              <Skull className="w-3 h-3 text-primary" />
            </div>
            <span className="text-sm font-semibold">Os Caloteiros</span>
          </div>
          <p className="text-xs text-muted-foreground">Controle de despesas entre amigos · {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
