// src/components/LoginButton.tsx
"use client";

export default function LoginButton({
  isLoggedIn,
  onLogin,
}: {
  isLoggedIn: boolean | undefined;
  onLogin: () => void;
}) {
  return (
    <button
      onClick={onLogin}
      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
      disabled={!isLoggedIn === undefined}
    >
      {isLoggedIn === undefined ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Verificando...
        </div>
      ) : isLoggedIn ? (
        "Logout"
      ) : (
        "Login com Google"
      )}
    </button>
  );
}
