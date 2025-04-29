import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, Outlet, useMatches } from '@tanstack/react-router';
import { Calendar, Home, Image, Tag, UserCircle } from 'lucide-react';
import { userWithRolesQueryOptions } from '@/utils/supabase/fetch-user-roles-server-fn';
import { studentContactQueryOptions } from '@/utils/student-contact';

import { StudentThemeProvider } from '@/components/student-theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
// Import student theme css
import studentThemeCss from '@/styles/student-theme.css?url';

export const Route = createFileRoute('/_protected/_student')({
  head: () => ({
    links: [{ rel: 'stylesheet', href: studentThemeCss }],
  }),
  component: StudentLayout,
  beforeLoad: async ({ context }) => {
    // Check if user is authenticated
    if (!context.user) {
      // Throw an error that will be caught by the error boundary
      throw new Error('You must be logged in to access this area');
    }
  },
  loader: async ({ context }) => {
    // Ensure both user and contact data are loaded
    await Promise.all([
      context.queryClient.ensureQueryData(userWithRolesQueryOptions()),
      context.queryClient.ensureQueryData(studentContactQueryOptions()),
    ]);

    return {
      user: context.user,
    };
  },
});

function StudentLayout() {
  // Use suspense queries to get user and contact data
  const { data: userData } = useSuspenseQuery(userWithRolesQueryOptions());
  const { data: contactData } = useSuspenseQuery(studentContactQueryOptions());

  return (
    <StudentThemeProvider>
      <div className="flex min-h-svh flex-col bg-background">
        <div className="container max-w-4xl mx-auto flex-1">
          <StudentHeader userData={userData} contactData={contactData} />
          <main className="flex-1 overflow-auto pb-16">
            <Outlet />
          </main>
        </div>
        <StudentTabBar />
      </div>
    </StudentThemeProvider>
  );
}

interface StudentHeaderProps {
  userData: any; // User data from userWithRolesQueryOptions
  contactData: any; // Contact data from studentContactQueryOptions
}

function StudentHeader({ userData, contactData }: StudentHeaderProps) {
  const matches = useMatches();

  // Get first name from contact data or user metadata
  const firstName = contactData?.first_name || userData?.user_metadata?.first_name || 'Student';

  // Find the most specific route that has a title
  const titleMatch = [...matches].reverse().find((match) => {
    const loaderData = match.loaderData as { title?: string } | undefined;
    return loaderData?.title !== undefined;
  });

  const title = (titleMatch?.loaderData as { title?: string } | undefined)?.title;
  const isHomeRoute = matches.some((match) => match.routeId === '/_protected/_student/');
  const displayTitle = isHomeRoute ? `Hello, ${firstName}!` : title || 'Student';

  return (
    <header className="z-10 flex h-16 shrink-0 items-center bg-background">
      <div className="flex w-full justify-between px-4">
        <h1 className="text-lg font-medium">{displayTitle}</h1>
        <AccountButton />
      </div>
    </header>
  );
}

function AccountButton() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <UserCircle />
          <span className="sr-only">Account</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/logout">Logout</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StudentTabBar() {
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.pathname || '';

  const tabs = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Image, label: 'Gallery', path: '/gallery' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
    { icon: Tag, label: 'Offers', path: '/offers' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-gradgo-900 z-20">
      <nav className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => (
          <TabButton
            key={tab.path}
            icon={tab.icon}
            label={tab.label}
            path={tab.path}
            isActive={
              currentPath.endsWith(tab.path) ||
              (tab.path === '/' &&
                (currentPath === '/_protected/_student/' || currentPath === '/_protected/_student'))
            }
          />
        ))}
      </nav>
    </div>
  );
}

interface TabButtonProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
}

function TabButton({ icon: Icon, label, path, isActive }: TabButtonProps) {
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        'flex-1 h-14 w-full flex-col items-center justify-center gap-1 rounded-large',
        isActive ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      <Link to={path}>
        <Icon className="h-5 w-5" />
        <span className="text-xs">{label}</span>
      </Link>
    </Button>
  );
}
