import { createFileRoute } from '@tanstack/react-router';
import lightModeLogo from '@/public/assets/logo-with-hat-dark.svg';
import darkModeLogo from '@/public/assets/logo-with-hat.svg';

import { SignUpForm } from '@/components/auth/sign-up';
import { useTheme } from '@/components/theme-provider';

export const Route = createFileRoute('/sign-up')({
  component: SignUp,
});

function SignUp() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <img
          src={resolvedTheme === 'dark' ? darkModeLogo : lightModeLogo}
          alt="GradGo"
          className="mx-auto h-36"
        />
        <SignUpForm />
      </div>
    </div>
  );
}
