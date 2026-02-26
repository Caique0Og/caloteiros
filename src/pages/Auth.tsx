import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skull, LogIn, UserPlus, ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type View = 'login' | 'signup' | 'otp';

const Auth = () => {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }
  if (user) return <Navigate to="/app" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('OTP')) {
        toast.info('É necessário verificar o código OTP enviado ao seu email.');
        setView('otp');
      } else {
        toast.error(error.message);
      }
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Código de verificação enviado para seu email!');
      setView('otp');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      toast.error('Digite o código completo');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup',
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Email verificado com sucesso!');
      navigate('/welcome');
    }
    setLoading(false);
  };

  const quickLogin = async (quickEmail: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: quickEmail, password: '123456' });
    if (error) {
      toast.error(error.message);
    } else {
      navigate('/app');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // Firebase will update auth state; useAuth hook handles redirect
    } catch (err: any) {
      toast.error(err.message || 'Erro ao entrar com Google');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm border-border/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center neon-glow">
              <Skull className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl neon-text">Os Caloteiros</CardTitle>
          <CardDescription>
            {view === 'login' && 'Faça login para continuar'}
            {view === 'signup' && 'Crie sua conta'}
            {view === 'otp' && 'Verifique seu email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* LOGIN */}
          {view === 'login' && (
            <>
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  <LogIn className="w-4 h-4" /> Entrar
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
              </div>

              <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin} disabled={loading}>
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Entrar com Google
              </Button>

              <Button variant="outline" className="w-full gap-2" onClick={() => { setView('signup'); setPassword(''); setConfirmPassword(''); }}>
                <UserPlus className="w-4 h-4" /> Criar conta
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Acesso rápido</span></div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => quickLogin('vini@teste')} disabled={loading}>Vini</Button>
                <Button variant="outline" size="sm" onClick={() => quickLogin('joao@teste')} disabled={loading}>João</Button>
                <Button variant="outline" size="sm" onClick={() => quickLogin('ca@teste')} disabled={loading}>Ca</Button>
              </div>
            </>
          )}

          {/* SIGNUP */}
          {view === 'signup' && (
            <>
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-confirm">Confirmar senha</Label>
                  <Input id="signup-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  <UserPlus className="w-4 h-4" /> Cadastrar
                </Button>
              </form>

              <Button variant="ghost" className="w-full gap-2" onClick={() => setView('login')}>
                <ArrowLeft className="w-4 h-4" /> Voltar ao login
              </Button>
            </>
          )}

          {/* OTP */}
          {view === 'otp' && (
            <>
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Enviamos um código de 6 dígitos para <span className="font-medium text-foreground">{email}</span>
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit" className="w-full" disabled={loading || otpCode.length < 6}>
                  Verificar
                </Button>
              </form>

              <Button variant="ghost" className="w-full gap-2" onClick={() => setView('signup')}>
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
