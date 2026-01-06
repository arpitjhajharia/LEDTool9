import React, { useState } from 'react';
import { auth } from '../config/firebase';
import { Lock, User, AlertCircle } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // check for default admin credentials
        if (username === 'admin' && password === 'admire123') {
            try {
                // If email/pass provider is disabled, we use anonymous sign-in to get a valid user session
                // while still respecting the admin password locally.
                const result = await auth.signInAnonymously();
                // We can add custom logic here if we need to distinguish admin from other anonymous users
                // but for now, this satisfies the requirement of logging in with the specific password.
                onLoginSuccess();
            } catch (err) {
                setError("Login failed: " + err.message);
            } finally {
                setLoading(false);
            }
            return;
        }

        // Standard Firebase Login for other users (requires Email/Pass provider enabled in Firebase)
        try {
            await auth.signInWithEmailAndPassword(username, password);
            onLoginSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 font-sans">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="p-8">
                        <div className="flex justify-center mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
                                <Lock size={32} />
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                ADMIRE <span className="text-teal-600 font-normal">SIGNAGE</span>
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Please sign in to access the dashboard</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 p-4 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm animate-in fade-in slide-in-from-top-1">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Username / Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none text-slate-800 dark:text-white"
                                        placeholder="admin or email@example.com"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none text-slate-800 dark:text-white"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:active:scale-100"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Sign In
                                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <p className="mt-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                    &copy; {new Date().getFullYear()} Admire Signage. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Login;
