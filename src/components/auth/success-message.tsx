import { Link } from '@tanstack/react-router';

interface SuccessMessageProps {
  primaryMessage: string;
  secondaryMessage: string;
  showLoginLink?: boolean;
}

export function SuccessMessage({
  primaryMessage,
  secondaryMessage,
  showLoginLink = true,
}: SuccessMessageProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-foreground">{primaryMessage}</p>
      <p className="text-sm text-foreground">{secondaryMessage}</p>
      {showLoginLink && (
        <p className="text-sm text-foreground">
          <Link className="text-foreground hover:text-primary hover:underline" to="/login">
            Return to login
          </Link>
        </p>
      )}
    </div>
  );
}
