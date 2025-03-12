// src/components/Header.tsx
"use client";

import LoginButton from "./LoginButton";

export default function Header({
  onLogin,
  isLoggedIn,
}: {
  onLogin: () => void;
  isLoggedIn: boolean | undefined;
}) {
  return (
    <header className="bg-gray-800 py-6 px-8 rounded-lg shadow-lg mb-8">
      <h1 className="text-3xl font-bold text-center text-gray-100">
        Eventos do Google Calendar
      </h1>
      <div className="text-center mt-4">
        <LoginButton isLoggedIn={isLoggedIn} onLogin={onLogin} />
      </div>
    </header>
  );
}
