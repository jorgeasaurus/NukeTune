import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useRouter } from "next/router";
import { useEffect, useRef, type ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function StatusScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--void-black)]">
      <div className="console-panel rounded-xl p-8 text-center" role="status">
        <div className="relative mx-auto mb-4 h-10 w-10">
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--console-border)] border-t-[var(--danger-red)]" />
          <div
            className="absolute inset-2 animate-spin rounded-full border-2 border-[var(--console-border)] border-t-[var(--nuke-orange)]"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
        </div>
        <p className="text-sm text-[var(--text-dim)]">
          <span className="text-[var(--terminal-green)]">$</span> {message}
        </p>
      </div>
    </div>
  );
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isAuthenticated && inProgress === "none" && !hasRedirected.current) {
      hasRedirected.current = true;
      void router.push("/");
    }
  }, [isAuthenticated, inProgress, router]);

  if (inProgress !== "none") {
    return fallback ?? <StatusScreen message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return fallback ?? <StatusScreen message="Redirecting to login..." />;
  }

  return <>{children}</>;
}
