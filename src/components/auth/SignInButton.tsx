interface SignInButtonProps {
  className?: string;
  onClick?: () => void;
}

export function SignInButton({ className, onClick }: SignInButtonProps) {
  return (
    <button
      onClick={onClick}
      className={
        className ??
        "rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
      }
    >
      <svg
        className="mr-2 inline-block h-5 w-5"
        viewBox="0 0 21 21"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
      Sign in with Microsoft
    </button>
  );
}
