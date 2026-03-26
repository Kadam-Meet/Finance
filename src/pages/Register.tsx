import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wallet, Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Contains number', test: (p: string) => /\d/.test(p) },
];

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = form.watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const result = await register(data.name, data.email, data.password);
      if (result.success) {
        toast({
          title: 'Account created!',
          description: 'Welcome to FinanceAI. Let\'s start tracking your expenses.',
        });
        navigate('/dashboard', { replace: true });
      } else {
        toast({
          variant: 'destructive',
          title: 'Registration failed',
          description: result.error || 'Something went wrong',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
            <Wallet className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">FinanceAI</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Start Your Journey
            <br />
            to Financial Freedom
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Join thousands of users who trust FinanceAI to manage their expenses
            and achieve their financial goals.
          </p>
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-xl p-4">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Smart Expense Tracking</p>
                <p className="text-white/70 text-sm">Auto-categorize with AI</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-xl p-4">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Predictive Analytics</p>
                <p className="text-white/70 text-sm">Know your future spending</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-xl p-4">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Group Expense Splitting</p>
                <p className="text-white/70 text-sm">Share costs with friends</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/60 text-sm">
          © 2024 FinanceAI. All rights reserved.
        </p>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">FinanceAI</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">Create account</h2>
            <p className="text-muted-foreground mt-2">
              Get started with your free account today
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a strong password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2">
                  {passwordRules.map((rule, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center gap-2 text-xs',
                        rule.test(password)
                          ? 'text-success'
                          : 'text-muted-foreground'
                      )}
                    >
                      {rule.test(password) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      {rule.label}
                    </div>
                  ))}
                </div>
              )}

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full gradient-primary hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
