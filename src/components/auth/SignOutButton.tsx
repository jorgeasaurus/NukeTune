import { useMsal } from "@azure/msal-react";

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const { instance } = useMsal();

  const handleSignOut = () => {
    void instance.logoutPopup({
      postLogoutRedirectUri: "/",
      mainWindowRedirectUri: "/",
    });
  };

  return (
    <button
      onClick={handleSignOut}
      className={className ?? "btn-terminal text-xs"}
    >
      Sign Out
    </button>
  );
}
