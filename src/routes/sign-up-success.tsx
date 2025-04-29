import { createFileRoute, Link } from '@tanstack/react-router';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/sign-up-success')({
  component: SignUpSuccess,
});

function SignUpSuccess() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Signup Confirmation Email Sent</CardTitle>
              <CardDescription>Check your email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  If your email exists in our system and requires confirmation, you will receive a
                  signup confirmation email.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check your inbox and follow the instructions in the email to complete your
                  account setup.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  <Link to="/login" className="text-primary hover:underline">
                    Return to login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
