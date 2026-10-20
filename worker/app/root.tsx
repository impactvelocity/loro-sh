import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import calSans from "cal-sans/fonts/calsans-var-full/CalSansVF.woff2?url";

import type { Route } from "./+types/root";
import { TooltipProvider } from "@/admin-components/ui/tooltip";
import { useDocumentAttributes } from "@/lib/document";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preload", href: calSans, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
  { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const attributes = useDocumentAttributes();

  return (
    <html lang="en" {...attributes} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Something went wrong";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "Page not found" : `Error ${error.status}`;
    details =
      error.status === 404
        ? "There's nothing at this address."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-3 p-6">
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{details}</p>
      {stack && (
        <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-4 text-xs">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
