import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { LogIn, Sparkles, ShieldCheck, Zap, Loader2, Mail, Lock, UserPlus, ArrowLeft, Chrome } from 'lucide-react';
import { AuthError } from '@supabase/supabase-js';

interface LoginViewProps {
  onLoginStart?: () => void; // Optional callback
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginStart }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'selection' | 'manual'>('selection');
  const [manualMode, setManualMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    if (onLoginStart) onLoginStart();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            prompt: 'select_account',
          },
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error("Google login failed:", authError);
      alert(`登入失敗: ${authError.message}`);
      setIsLoading(false);
    }
  };

  const getAuthErrorMessage = (error: AuthError): string => {
    const msg = error?.message || '';
    if (msg.includes('Invalid login credentials')) return '帳號或密碼錯誤，請重新確認。';
    if (msg.includes('Email not confirmed')) return '請先前往您的信箱，點擊驗證連結後再登入。\n（或者您可以聯絡管理員關閉信箱驗證）';
    if (msg.includes('User already registered')) return '此 Email 已被註冊，請直接登入。';
    if (msg.includes('Password should be')) return '密碼至少需要 6 個字元。';
    if (msg.includes('Unable to validate email')) return 'Email 格式不正確，請重新輸入。';
    if (msg.includes('rate limit')) return '操作太過頻繁（Rate Limit），請等候幾分鐘後再試一次，或嘗試使用 Google 登入。';
    if (msg.includes('Network')) return '網路連線異常，請檢查網路後再試。';
    return `操作失敗：${msg}`;
  };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !email || !password) return;
    if (onLoginStart) onLoginStart();
    setIsLoading(true);
    try {
      if (manualMode === 'signup') {
        const displayName = email.split('@')[0];
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: displayName,
              display_name: displayName,
            }
          }
        });
        
        if (error) throw error;
        
        if (data.session) {
          // 如果 Supabase 關閉了 Email 驗證，會直接登入並獲得 session
          return;
        } else {
          // Supabase 設定了 email 驗證 — data.session 為 null
          alert('註冊成功！\n\n系統已發送驗證信（若未收到，請檢查垃圾信箱）。\n\n💡 提示：若想快速測試，可前往 Supabase 後台關閉 "Confirm email" 設定。');
          setManualMode('login');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error("Manual auth failed:", authError);
      alert(getAuthErrorMessage(authError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#4F46E5] via-[#7C3AED] to-[#DB2777] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Background Decorations */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          rotate: [0, -120, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.1 }}
            className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl transform -rotate-6"
          >
            <Sparkles size={40} className="text-indigo-600" />
          </motion.div>
          <h1 className="text-5xl font-black mb-2 tracking-tighter">FOCUS AI</h1>
          <p className="text-white/70 font-medium">提升效率，從現在開始</p>
        </div>

        <AnimatePresence mode="wait">
          {loginMethod === 'selection' ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <button
                onClick={() => setLoginMethod('manual')}
                className="w-full bg-white text-indigo-600 h-16 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all hover:bg-gray-50 active:scale-95"
              >
                <Mail size={24} />
                帳號密碼登入 / 註冊
              </button>

              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 h-16 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all hover:bg-white/20 active:scale-95 disabled:opacity-70"
              >
                {isLoading ? <Loader2 size={24} className="animate-spin text-white" /> : <Chrome size={24} className="text-white/80" />}
                Google 帳號快速登入
              </button>

              <div className="pt-8 space-y-3">
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10">
                  <ShieldCheck size={18} className="text-green-400" />
                  <span className="text-xs font-semibold text-white/80">安全加密資料儲存</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10">
                  <Zap size={18} className="text-yellow-400" />
                  <span className="text-xs font-semibold text-white/80">即時同步多端紀錄</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl"
            >
              <button 
                onClick={() => setLoginMethod('selection')}
                className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold"
              >
                <ArrowLeft size={16} /> 返回選擇
              </button>

              <h2 className="text-2xl font-black mb-6">
                {manualMode === 'login' ? '歡迎回來' : '建立帳號'}
              </h2>

              <form onSubmit={handleManualAuth} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">電子信箱</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-white/40 transition-all placeholder:text-white/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase tracking-wider ml-1">密碼</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-white/40 transition-all placeholder:text-white/20"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white text-indigo-600 h-14 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-2 mt-4 hover:bg-gray-50 active:scale-95 disabled:opacity-70 transition-all"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    manualMode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />
                  )}
                  {manualMode === 'login' ? '登入' : '註冊'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => setManualMode(manualMode === 'login' ? 'signup' : 'login')}
                  className="text-sm font-bold text-white/60 hover:text-white transition-colors"
                >
                  {manualMode === 'login' ? '還沒有帳號？ 立即註冊' : '已經有帳號了？ 立即登入'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <p className="mt-10 text-[10px] text-center text-white/40 font-medium leading-relaxed px-4">
          登入即代表您同意我們的服務條款與隱私權政策<br/>
          Focus AI 打造您的專注生活
        </p>
      </motion.div>
    </div>
  );
};

export default LoginView;
