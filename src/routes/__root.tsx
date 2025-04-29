import * as React from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { DefaultCatchBoundary } from '../components/default-catch-boundary';
import { NotFound } from '../components/not-found';
import { ThemeProvider } from '../components/theme-provider';
import appCss from '../styles/app.css?url';
import { Toaster } from '@/components/ui/sonner';
import { userWithRolesQueryOptions } from '@/utils/supabase/fetch-user-roles-server-fn';

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  user?: { email: string; id: string; roles: string[] } | null;
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
    scripts: [
      {
        id: 'theme-initializer',
        children: `\n(function() {\n  try {\n    var theme = localStorage.getItem('gradgo-ui-theme');\n    if (!theme || theme === 'system') {\n      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';\n    }\n    document.documentElement.classList.remove('light', 'dark');\n    document.documentElement.classList.add(theme);\n  } catch (e) {}\n})();\n`,
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    try {
      // Use the query client to ensure the user data is cached
      const user = await context.queryClient.ensureQueryData(userWithRolesQueryOptions());
      return {
        user,
      };
    } catch (error) {
      console.error('[RootRoute] Error fetching user:', error);
      return {
        user: null,
      };
    }
  },
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-dm-sans bg-background">
        <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
        <Scripts />
        <Toaster />
        {/* Devtools are rendered after Scripts to ensure they're only mounted client-side */}
        <ClientOnly>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </ClientOnly>
      </body>
    </html>
  );
}

// Client-only component to prevent server-side rendering of children
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : null;
}
