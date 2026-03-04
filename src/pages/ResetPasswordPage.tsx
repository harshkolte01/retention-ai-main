import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoImg from '@/assets/logo.png';

/**
 * This route exists for legacy deep-link compatibility.
 * Password reset is handled via the "Forgot password?" dialog on the
 * Login page (OTP flow via Supabase Edge Functions + profiles table).
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();

  // Automatically redirect to login after 4 seconds
  useEffect(() => {
    const t = setTimeout(() => navigate('/login'), 4000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl shadow-elevated border border-border p-8 text-center">
          <div className="flex flex-col items-center mb-6">
            <img src={logoImg} alt="Logo" className="h-16 w-16 rounded-xl mb-3" />
            <h1 className="font-display text-2xl font-bold">
              FoodRetain<span className="text-primary">AI</span>
            </h1>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <h2 className="font-semibold text-lg">Reset your password</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Use the <strong>"Forgot password?"</strong> link on the sign-in page to
              receive a 6-digit verification code by email and set a new password.
            </p>
            <p className="text-xs text-muted-foreground">Redirecting you to sign-in…</p>
            <Button onClick={() => navigate('/login')} className="w-full mt-1">
              Go to Sign In
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
