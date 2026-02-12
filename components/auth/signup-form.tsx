'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { signupSchema, type SignupInput } from '@/lib/validations/auth-schemas';

export function SignupForm() {
    const router = useRouter();
    const [formData, setFormData] = useState<SignupInput>({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const isEmpty =
        !formData.name ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const validationResult = signupSchema.safeParse(formData);
            if (!validationResult.success) {
                setError(validationResult.error.issues[0].message);
                setIsLoading(false);
                return;
            }

            const supabase = createClient();
            const { error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: { full_name: formData.name },
                },
            });

            if (signUpError) {
                setError(signUpError.message);
                setIsLoading(false);
                return;
            }

            router.push('/');
            router.refresh();
        } catch (err) {
            console.error('Signup error:', err);
            setError('An error occurred during registration');
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto px-4">
            <div className="app-card p-8">
                <div className="mb-6 text-center space-y-2">
                    <p className="text-xs font-semibold tracking-[0.2em] uppercase text-orange-500">
                        Join Snipp
                    </p>
                    <h2>Create your account</h2>
                    <p className="text-xs md:text-sm" style={{ color: '#666666' }}>
                        Collaborate on snippets in real time with AI-powered search.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="app-input-label">
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="app-input"
                            placeholder="John Doe"
                            required
                            disabled={isLoading}
                        />
                    </div>

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
                        <p className="mt-1 text-xs text-slate-500">
                            At least 8 characters, 1 uppercase letter, 1 number
                        </p>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="app-input-label">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) =>
                                setFormData({ ...formData, confirmPassword: e.target.value })
                            }
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
                        {isLoading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs md:text-sm" style={{ color: '#666666' }}>
                    Already have an account?{' '}
                    <a href="/auth/login" className="font-medium" style={{ color: '#ff8c4b' }}>
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
}
