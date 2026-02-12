import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        redirect('/');
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center bg-white px-4">
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: 'url(/grid.svg)',
                    backgroundSize: '32px 32px',
                    backgroundRepeat: 'repeat',
                }}
            />
            <div className="z-10">
                <LoginForm />
            </div>
        </div>
    );
}
