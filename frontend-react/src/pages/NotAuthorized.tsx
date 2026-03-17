import { Link, useLocation } from 'react-router-dom';

export default function NotAuthorized() {
  const location = useLocation();
  const from = (location.state as any)?.from as string | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef2f6] via-[#fdfaf4] to-[#faedd0] dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-slate-100 p-6 font-sans">
      <div className="max-w-xl mx-auto mt-24 bg-white/70 backdrop-blur-md dark:bg-slate-800/80 rounded-[32px] border border-white/40 dark:border-slate-700/50 shadow-sm p-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Error 403</p>
        <h1 className="mt-2 text-3xl font-light tracking-tight">Not authorized</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Your account does not have access to this page{from ? `: ${from}` : '.'}
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-2xl font-medium transition-colors shadow-sm"
          >
            Back to dashboard
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-medium transition-colors"
          >
            Switch account
          </Link>
        </div>
      </div>
    </div>
  );
}

