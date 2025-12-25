import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email tidak valid" }).max(255),
  password: z.string().min(6, { message: "Password minimal 6 karakter" }).max(100)
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      localStorage.setItem('referralCode', refCode);
      toast({
        title: "Referral Code Applied!",
        description: "Sign up to get rewards for you and your referrer",
      });
      setIsSignUp(true); 
    }
  }, [searchParams, toast]);

  if (user) {
    navigate('/admin');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.parse({ email, password });
      setLoading(true);

      const { error } = isSignUp 
        ? await signUp(validated.email, validated.password)
        : await signIn(validated.email, validated.password);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: isSignUp ? "Akun berhasil dibuat!" : "Berhasil login!",
          description: isSignUp ? "Silakan login dengan akun Anda" : "Selamat datang kembali"
        });
        
        if (!isSignUp) {
          navigate('/admin');
        } else {
          setIsSignUp(false);
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Validasi Error",
          description: err.errors[0].message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? 'Buat Akun' : 'Login Admin'}
          </CardTitle>
          <CardDescription>
            {isSignUp ? 'Daftar untuk membuat akun baru' : 'Masuk ke dashboard admin'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Daftar' : 'Login'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              {isSignUp ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}