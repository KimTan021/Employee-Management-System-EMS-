import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../components/theme-provider';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { username, password });
      setAuth(data.token, data.username, data.role);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || err.code === 'ERR_CONNECTION_REFUSED') {
        setError('Cannot connect to the server. Please ensure the backend is running on port 8080.');
      } else {
        setError(err.response?.data?.message || 'Invalid credentials. Please check your username and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#eef2f6] via-[#fdfaf4] to-[#faedd0] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 font-sans transition-colors duration-300 p-4">
      {/* Background abstract shape to match reference style */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/40 dark:bg-slate-700/20 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none opacity-60"></div>
      
      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-20">
         <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-3 text-slate-500 bg-white/50 backdrop-blur-sm shadow-sm hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:text-slate-400 rounded-full transition-all border border-white/40 dark:border-slate-700/50"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
      </div>

      <div className="w-full max-w-md space-y-8 rounded-[32px] bg-white/80 backdrop-blur-xl p-10 shadow-2xl dark:bg-slate-800/90 border border-white/50 dark:border-slate-700/50 relative z-10">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-lg dark:bg-slate-700 rotate-3 transition-transform hover:rotate-6">
            <span className="text-2xl font-bold tracking-tighter">EMS<span className="text-accent">.</span></span>
          </div>
          <h2 className="mt-8 text-4xl font-light tracking-tight text-slate-900 dark:text-white">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
            Please enter your details to sign in
          </p>
        </div>
        
        <form className="mt-10 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-2xl bg-red-50 p-4 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30">
              <p className="text-sm font-medium text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="relative block w-full appearance-none rounded-2xl border-none bg-slate-100/80 px-4 py-4 text-slate-900 placeholder-slate-400 focus:z-10 focus:outline-none focus:ring-2 focus:ring-accent sm:text-sm dark:bg-slate-900/50 dark:text-white dark:placeholder-slate-500 transition-all shadow-inner"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full appearance-none rounded-2xl border-none bg-slate-100/80 px-4 py-4 text-slate-900 placeholder-slate-400 focus:z-10 focus:outline-none focus:ring-2 focus:ring-accent sm:text-sm dark:bg-slate-900/50 dark:text-white dark:placeholder-slate-500 transition-all shadow-inner"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
             <div className="flex items-center">
               <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-accent dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-accent" />
               <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-400">Remember me</label>
             </div>
             <div className="text-sm">
               <a href="#" className="font-medium text-slate-900 hover:text-slate-700 dark:text-white dark:hover:text-slate-300 transition-colors">Forgot password?</a>
             </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-2xl border border-transparent bg-slate-900 px-4 py-4 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:bg-slate-400 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:focus:ring-white dark:focus:ring-offset-slate-900 transition-all shadow-lg shadow-slate-900/20 dark:shadow-white/10"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                {loading ? (
                   <svg className="h-5 w-5 animate-spin text-white dark:text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                ) : (
                  <svg className="h-5 w-5 text-slate-500 group-hover:text-slate-400 dark:text-slate-400 dark:group-hover:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </span>
              {loading ? 'Authenticating...' : 'Sign in to account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
