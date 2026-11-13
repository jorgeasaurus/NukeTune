import { AuthError } from "@azure/msal-browser";

// The user closing the popup is not an error worth reporting back to them.
const CANCELLED_CODES = new Set(["user_cancelled", "user_canceled"]);

/**
 * Turns an error thrown by `signIn()` into a message for the user, or `null`
 * when the user simply cancelled.
 */
export function getSignInErrorMessage(error: unknown): string | null {
  if (error instanceof AuthError) {
    if (CANCELLED_CODES.has(error.errorCode)) return null;
    switch (error.errorCode) {
      case "popup_window_error":
      case "empty_window_error":
        return "The sign-in popup was blocked. Allow popups for this site and try again.";
      case "interaction_in_progress":
        return "A sign-in is already in progress. Finish or close it, then try again.";
      default:
        return "Sign in failed. Please try again.";
    }
  }
  // signIn() throws plain Errors with user-facing text, e.g. the
  // Global Commercial-only rejection.
  if (error instanceof Error && error.message) return error.message;
  return "Sign in failed. Please try again.";
}

interface SignInErrorAlertProps {
  message: string;
  onDismiss: () => void;
  className?: string;
}

export function SignInErrorAlert({
  message,
  onDismiss,
  className,
}: SignInErrorAlertProps) {
  return (
    <div
      role="alert"
      className={`banner-danger flex items-start gap-3 text-left ${className ?? ""}`}
    >
      <svg
        className="mt-0.5 h-5 w-5 shrink-0 text-[var(--danger-red)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p className="flex-1 text-sm text-white">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss sign-in error"
        className="-m-2 rounded p-2 text-[var(--text-dim)] transition-colors hover:text-white"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
