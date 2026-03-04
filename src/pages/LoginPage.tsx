import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, KeyRound, Loader2, ShieldCheck, CheckCircle2, Trash2, Users, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import emailjs from '@emailjs/browser';
import { signIn, signUp, updatePassword as localUpdatePassword, getAllUsers, deleteUser, type LocalUser } from '@/lib/localAuth';
import logoImg from '@/assets/logo.png';

// ── EmailJS config ──────────────────────────────────────────────────────────
// 1. Sign up free at https://emailjs.com
// 2. Add a Gmail service  → copy Service ID  → paste below
// 3. Create an email template with variables: {{to_email}}, {{otp}}, {{app_name}}
//    → copy Template ID → paste below
// 4. Account → API Keys → copy Public Key → paste below
const EMAILJS_SERVICE_ID  = 'service_i418tzj';   // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'template_aj2261b';  // e.g. 'template_xyz456'
const EMAILJS_PUBLIC_KEY  = 'Z2ewSk8VBhNUZDGoL';   // e.g. 'aBcDeFgHiJkLmNoP'
// ───────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(searchParams.get('signup') === 'true');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  // step 1 = enter email, step 2 = enter OTP, step 3 = set new password, step 4 = done
  const [resetStep, setResetStep] = useState<1 | 2 | 3 | 4>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [accounts, setAccounts] = useState<LocalUser[]>([]);
  const [showAccounts, setShowAccounts] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocalUser | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const refreshAccounts = useCallback(() => {
    setAccounts(getAllUsers());
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const openForgotDialog = () => {
    setResetEmail(email);
    setOtpCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetStep(1);
    setForgotDialogOpen(true);
  };

  const closeForgotDialog = () => {
    setForgotDialogOpen(false);
    setTimeout(() => { setResetStep(1); setOtpCode(''); setNewPassword(''); setConfirmNewPassword(''); }, 300);
  };

  // Step 1 → generate OTP client-side and send via EmailJS (real email, no backend)
  const handleSendOtp = async () => {
    if (!resetEmail) {
      toast({ title: 'Enter your email', variant: 'destructive' });
      return;
    }
    setResetLoading(true);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // Store OTP in sessionStorage with 10-min expiry
      sessionStorage.setItem('reset_otp', JSON.stringify({
        otp,
        email: resetEmail,
        expires: Date.now() + 10 * 60 * 1000,
      }));

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: resetEmail,
          otp,
          app_name: 'FoodRetainAI',
        },
        EMAILJS_PUBLIC_KEY
      );

      setResetStep(2);
      toast({ title: 'Code sent! 📧', description: `A 6-digit code was sent to ${resetEmail}. Check your inbox and spam folder.` });
    } catch (err: unknown) {
      const msg = (err as { text?: string })?.text || (err as Error)?.message || 'Unknown error';
      toast({
        title: 'Failed to send email',
        description: `EmailJS error: ${msg}. Make sure EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID and EMAILJS_PUBLIC_KEY are configured in LoginPage.tsx`,
        variant: 'destructive',
      });
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2 → verify against OTP stored in sessionStorage
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast({ title: 'Enter the 6-digit code', variant: 'destructive' });
      return;
    }
    const raw = sessionStorage.getItem('reset_otp');
    if (!raw) {
      toast({ title: 'Session expired', description: 'Please request a new code.', variant: 'destructive' });
      setResetStep(1);
      return;
    }
    const { otp, email, expires } = JSON.parse(raw) as { otp: string; email: string; expires: number };
    if (Date.now() > expires) {
      sessionStorage.removeItem('reset_otp');
      toast({ title: 'Code expired', description: 'Please request a new code.', variant: 'destructive' });
      setResetStep(1);
      return;
    }
    if (email !== resetEmail) {
      toast({ title: 'Email mismatch', description: 'Please restart the process.', variant: 'destructive' });
      setResetStep(1);
      return;
    }
    if (otp !== otpCode) {
      toast({ title: 'Incorrect code', description: 'Double-check the code in your email.', variant: 'destructive' });
      return;
    }
    sessionStorage.removeItem('reset_otp');
    setResetStep(3);
  };

  // Step 3 → set new password using Supabase Admin API directly
  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'At least 6 characters required.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setResetLoading(true);
    try {
      const { error } = localUpdatePassword(resetEmail, newPassword);
      if (error) throw new Error(error);

      setResetStep(4);
      setForgotSent(true);
      toast({ title: 'Password updated! ✓', description: 'You can now sign in with your new password.' });
      setTimeout(() => closeForgotDialog(), 2000);
    } catch (err: unknown) {
      toast({ title: 'Failed to update password', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignup && !name)) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    if (isSignup) {
      const { error } = signUp(email, password, name);
      setLoading(false);
      if (error) { toast({ title: 'Sign up failed', description: error, variant: 'destructive' }); return; }
      toast({ title: 'Account created!', description: 'You can now sign in with your credentials.' });
      refreshAccounts();
      setShowAccounts(true);
      setIsSignup(false);
    } else {
      const { error } = signIn(email, password);
      setLoading(false);
      if (error) { toast({ title: 'Sign in failed', description: error, variant: 'destructive' }); return; }
      toast({ title: 'Welcome back!', description: 'Redirecting to dashboard...' });
      refreshAccounts();
      setTimeout(() => navigate('/dashboard'), 800);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl shadow-elevated border border-border p-8">
          <div className="flex flex-col items-center mb-8">
            <img src={logoImg} alt="Logo" className="h-16 w-16 rounded-xl mb-3" />
            <h1 className="font-display text-2xl font-bold">FoodRetain<span className="text-primary">AI</span></h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignup ? 'Create your account' : 'Sign in to your dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="Enter your name" className="pl-10" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="Enter your email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!isSignup && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={openForgotDialog}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {forgotSent ? 'Password reset ✓' : 'Forgot password?'}
                  </button>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isSignup ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsSignup(!isSignup); setForgotSent(false); }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {/* ── Registered Accounts Panel ─────────────────────────── */}
        {accounts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-5 bg-card rounded-2xl shadow-elevated border border-border overflow-hidden"
          >
            {/* Header / toggle */}
            <button
              type="button"
              onClick={() => setShowAccounts((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" />
                <span>Registered Accounts</span>
                <span className="ml-1 bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {accounts.length}
                </span>
              </div>
              {showAccounts
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>

            {/* Account list */}
            <AnimatePresence initial={false}>
              {showAccounts && (
                <motion.ul
                  key="accounts-list"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden divide-y divide-border"
                >
                  {accounts.map((acc) => {
                    const initials = acc.name
                      .split(' ')
                      .map((w) => w[0]?.toUpperCase() ?? '')
                      .slice(0, 2)
                      .join('');
                    return (
                      <motion.li
                        key={acc.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="flex items-center gap-3 px-5 py-3 group hover:bg-muted/30 transition-colors"
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                          {initials || '?'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{acc.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{acc.email}</p>
                        </div>

                        {/* Created date */}
                        <span className="text-xs text-muted-foreground hidden sm:block flex-shrink-0">
                          {new Date(acc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(acc)}
                          title="Delete account"
                          className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* ── Delete Account Confirmation ────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Delete Account Permanently?</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>{' '}
              (<span className="font-mono text-xs">{deleteTarget?.email}</span>) and all associated data.
              This action <strong>cannot be undone</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                const { error } = deleteUser(deleteTarget.email);
                if (error) {
                  toast({ title: 'Delete failed', description: error, variant: 'destructive' });
                } else {
                  toast({ title: 'Account deleted', description: `${deleteTarget.name} has been removed.` });
                  refreshAccounts();
                }
                setDeleteTarget(null);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Forgot Password Dialog — 3-step OTP flow */}
      <Dialog open={forgotDialogOpen} onOpenChange={(open) => { if (!open) closeForgotDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {resetStep === 4 ? <CheckCircle2 className="h-5 w-5 text-green-500" /> :
                 resetStep === 3 ? <Lock className="h-5 w-5 text-primary" /> :
                 resetStep === 2 ? <ShieldCheck className="h-5 w-5 text-primary" /> :
                 <KeyRound className="h-5 w-5 text-primary" />}
              </div>
              <DialogTitle className="text-lg">
                {resetStep === 1 && 'Forgot Password'}
                {resetStep === 2 && 'Enter Verification Code'}
                {resetStep === 3 && 'Set New Password'}
                {resetStep === 4 && 'Password Updated!'}
              </DialogTitle>
            </div>
            <DialogDescription>
              {resetStep === 1 && "Enter your account email and we'll send a 6-digit verification code."}
              {resetStep === 2 && `Enter the 6-digit code from the password reset email sent to ${resetEmail}. Check spam if not in inbox.`}
              {resetStep === 3 && 'Choose a strong new password for your account.'}
              {resetStep === 4 && 'Your password has been updated. You can now sign in.'}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {resetStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-2 py-2">
                <Label htmlFor="reset-email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  />
                </div>
              </motion.div>
            )}

            {resetStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="py-4 flex flex-col items-center gap-4">
                <p className="text-sm text-muted-foreground text-center">
                  Didn't receive it? <button type="button" onClick={handleSendOtp} className="text-primary hover:underline">Resend code</button>
                </p>
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
              </motion.div>
            )}

            {resetStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3 py-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmNewPassword && newPassword !== confirmNewPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>
              </motion.div>
            )}

            {resetStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 py-6">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <p className="text-sm text-muted-foreground">Closing automatically…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {resetStep !== 4 && (
            <DialogFooter className="gap-2 sm:gap-0">
              {resetStep > 1 && (
                <Button variant="outline" onClick={() => setResetStep((s) => (s - 1) as 1 | 2 | 3)} disabled={resetLoading}>
                  Back
                </Button>
              )}
              {resetStep === 1 && (
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              )}
              {resetStep === 1 && (
                <Button onClick={handleSendOtp} className="gap-2" disabled={resetLoading}>
                  {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send Code
                </Button>
              )}
              {resetStep === 2 && (
                <Button onClick={handleVerifyOtp} className="gap-2" disabled={resetLoading || otpCode.length !== 6}>
                  {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Verify Code
                </Button>
              )}
              {resetStep === 3 && (
                <Button onClick={handleUpdatePassword} className="gap-2" disabled={resetLoading}>
                  {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Update Password
                </Button>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

