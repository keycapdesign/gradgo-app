import { createFileRoute } from '@tanstack/react-router';
import lightModeLogo from '@/public/assets/logo-with-hat-dark.svg';
import darkModeLogo from '@/public/assets/logo-with-hat.svg';

import { LoginForm } from '@/components/auth/login';
import { useTheme } from '@/components/theme-provider';

export const Route = createFileRoute('/login')({
  component: Login,
});

function Login() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <img
          src={resolvedTheme === 'dark' ? darkModeLogo : lightModeLogo}
          alt="GradGo"
          className="mx-auto h-36"
        />
        <LoginForm />
      </div>
    </div>
  );
}
