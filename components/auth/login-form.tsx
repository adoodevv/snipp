'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { loginSchema, type LoginInput } from '@/lib/validations/auth-schemas';
import { FaGithub } from 'react-icons/fa';

export function LoginForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<LoginInput>({ email: '', password: '' });
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const isEmpty = !formData.email || !formData.password;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const validationResult = loginSchema.safeParse(formData);
            if (!validationResult.success) {
                setError(validationResult.error.issues[0].message);
                setIsLoading(false);
                return;
            }

            const supabase = createClient();
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (signInError) {
                setError(signInError.message === 'Invalid login credentials' ? 'Invalid email or password' : signInError.message);
                setIsLoading(false);
                return;
            }

            router.push('/');
            router.refresh();
        } catch (err) {
            console.error('Login error:', err);
            setError('An error occurred during login');
            setIsLoading(false);
        }
    };

    const handleGithubSignIn = async () => {
        setError('');
        setIsLoading(true);
        try {
            const supabase = createClient();
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (oauthError) {
                setError(oauthError.message);
                setIsLoading(false);
                return;
            }
            // OAuth redirects away, no need to setIsLoading(false)
        } catch (err) {
            console.error('GitHub sign in error:', err);
            setError('An error occurred during GitHub sign in');
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto px-4">
            <div className="app-card p-6 sm:p-8">
                <div className="mb-6 text-center space-y-2">
                    <p className="text-xs font-semibold tracking-[0.2em] uppercase text-orange-500">
                        Welcome back
                    </p>
                    <h2>Sign in to Snipp</h2>
                    <p className="text-xs md:text-sm" style={{ color: '#666666' }}>
                        Real-time collaborative code snippets with AI-powered search.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="app-input-label">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="app-input"
                            placeholder="you@example.com"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="app-input-label">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="app-input"
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || isEmpty}
                        className="app-button-primary"
                    >
                        {isLoading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="px-4 text-xs uppercase tracking-[0.2em]" style={{ color: '#999999' }}>
                        or
                    </span>
                    <div className="flex-1 border-t border-gray-200" />
                </div>

                <button
                    onClick={handleGithubSignIn}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 py-3 px-5 border rounded-full w-full border-gray-400 hover:bg-gray-100 transition-colors duration-300"
                >
                    <FaGithub className="text-lg" />
                    <span>Sign in with GitHub</span>
                </button>

                <p className="mt-6 text-center text-xs md:text-sm" style={{ color: '#666666' }}>
                    Don&apos;t have an account?{' '}
                    <a href="/auth/signup" className="font-medium" style={{ color: '#ff8c4b' }}>
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}
