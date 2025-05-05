
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import SignupForm from '@/components/SignupForm';
import { supabase } from '@/lib/supabase';
import { AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from '@/hooks/use-translation';
import { User } from '@/types';
// Email verification completely removed

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useTranslation();
  const [signupError, setSignupError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        console.error('Login error:', error);
        return;
      }

      if (data.user) {
        toast({
          title: "Login successful",
          description: "You have been logged in successfully",
        });
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (userData: Omit<User, 'id'> & { password: string }) => {
    setIsLoading(true);
    setSignupError('');

    try {
      console.log('Signing up with data:', {
        email: userData.email,
        name: userData.name,
        gender: userData.gender,
        university: userData.university
      });

      // Email verification completely removed

      // First, create the auth user
      const { data, error } = await supabase.auth.signUp({
        email: userData.email || '',
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            gender: userData.gender,
            university: userData.university
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        setSignupError(`Signup error: ${error.message}`);
        return;
      }

      if (!data.user) {
        setSignupError('No user data returned from signup. Please try again.');
        return;
      }

      // Wait a moment for the trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if the profile was created successfully
      const { error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile after signup:', profileError);

        // If profile doesn't exist, create it manually
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name: userData.name,
            email: userData.email,
            gender: userData.gender,
            university: userData.university,
            isAdmin: false,
            totalPoints: 0
          });

        if (insertError) {
          console.error('Error creating profile manually:', insertError);
          setSignupError(`Profile creation error: ${insertError.message}`);
          return;
        }
      }

      toast({
        title: "Account created",
        description: "Your account has been created successfully",
      });
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Unexpected signup error:', err);
      setSignupError(`Unexpected error: ${errorMessage}`);

      // Log additional details if available
      if (err instanceof Error) {
        const errorObj = err as unknown as Record<string, unknown>;
        if ('code' in errorObj) {
          console.error('Error code:', errorObj.code);
        }
        if ('details' in errorObj) {
          console.error('Error details:', errorObj.details);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        isLoggedIn={false}
        onLogout={() => {}} // Dummy function for the type check
      />

      <div className="container flex items-center justify-center min-h-[90vh] py-12">
        <Card className="mx-auto max-w-md w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Bloc Shop Comp</CardTitle>
            <CardDescription>
              Enter your credentials to access the competition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">{t('login')}</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : t('login')}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <SignupForm
                  onSubmit={handleSignup}
                  isLoading={isLoading}
                  passwordError={signupError}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm text-muted-foreground w-full">
              By continuing, you agree to the competition terms and conditions.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
