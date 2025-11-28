'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Flower, Moon, Sun, Globe, Pill, Activity } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useI18n } from '@/lib/i18n-context';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const [employee_id, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const tid = toast.loading(t('loggingIn'));
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id, password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        toast.success(`${t('welcome')}, ${data.user.firstname}!`, { id: tid });
        router.push('/dashboard');
      } else {
        throw new Error(data.error || t('errorLogin'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('errorOccurred'), { id: tid });
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-200/20 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-200/20 blur-3xl dark:bg-indigo-900/20" />
      </div>

      {/* Top Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          className="rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 shadow-sm"
          title={t('language')}
        >
          <span className="font-bold text-xs">{language.toUpperCase()}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full bg-white/50 backdrop-blur-sm hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-800/80 shadow-sm"
          title={t('toggleTheme')}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('toggleTheme')}</span>
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md px-4 z-10"
      >
        <Card className="w-full border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
          <CardHeader className="space-y-1 text-center pb-8 pt-8">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {t('loginTitle')}
            </CardTitle>
            <CardDescription className="text-base font-medium text-slate-500 dark:text-slate-400">
              {t('loginSubtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="employee_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  {t('usernameLabel')}
                </Label>
                <div className="relative group">
                  <Input
                    id="employee_id"
                    type="text"
                    placeholder={t('usernamePlaceholder')}
                    required
                    value={employee_id}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    disabled={loading}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-950/50 dark:border-slate-800 dark:focus:bg-slate-950"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  {t('passwordLabel')}
                </Label>
                <div className="relative group">
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('passwordPlaceholder')}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 px-4 transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-950/50 dark:border-slate-800 dark:focus:bg-slate-950"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('loggingIn')}
                  </div>
                ) : (
                  t('loginButton')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          © 2024 AssetFlow System. All rights reserved.
        </p>
      </motion.div>
    </main>
  );
}