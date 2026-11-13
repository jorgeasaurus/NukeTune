import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { resetTenantSession } from "~/store";

interface SignOutButtonProps {
  className?: string;
}

function describeSignOutError(error: unknown): string | null {
  const code =
    error && typeof error === "object" && "errorCode" in error
      ? String((error as { errorCode?: unknown }).errorCode)
      : "";
  if (code === "user_cancelled") return null;
  if (code === "popup_window_error" || code === "empty_window_error") {
    return "Sign-out popup was blocked. Allow popups for this site and try again.";
  }
  return error instanceof Error && error.message
    ? `Sign-out failed: ${error.message}`
    : "Sign-out failed. Try again.";
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const { instance } = useMsal();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSignOut = async () => {
    setError(null);
    setPending(true);
    try {
      await instance.logoutPopup({
        postLogoutRedirectUri: "/",
        mainWindowRedirectUri: "/",
      });
      // TenantSessionSync also resets when the active account clears; do it
      // here too so nothing from this tenant survives a completed sign-out.
      resetTenantSession();
    } catch (err) {
      console.error("Sign-out failed", err);
      setError(describeSignOutError(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={pending}
        aria-describedby={error ? "sign-out-error" : undefined}
        className={className ?? "btn-terminal text-xs"}
      >
        {pending ? "Signing Out..." : "Sign Out"}
      </button>
      {error && (
        <span
          id="sign-out-error"
          role="alert"
          className="console-panel absolute right-0 top-full z-50 mt-2 w-64 rounded-md p-3 text-left text-xs text-[var(--warning-amber)]"
        >
          {error}
        </span>
      )}
    </span>
  );
}
