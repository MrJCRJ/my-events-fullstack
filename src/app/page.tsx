// src/app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import MonthlySummarySection from "@/components/MonthlySummarySection";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Event, MonthlySummary } from "@/app/types/types";

export default function Home() {
  const [summary, setSummary] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const clearError = () => setError(null);

  const handleLogin = useCallback(async () => {
    if (isLoggedIn) {
      try {
        // Faz uma requisição POST para logout
        const response = await fetch("http://localhost:3000/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          // Limpa os dados locais apenas se o logout for bem-sucedido
          localStorage.removeItem("jwtToken");
          setToken(null);
          setIsLoggedIn(false);
          // Recarrega a página para limpar qualquer estado
          window.location.href = window.location.origin;
        } else {
          setError("Falha ao fazer logout. Tente novamente.");
        }
      } catch (err) {
        console.error("Logout error:", err);
        setError("Erro ao conectar com o servidor para logout");
      }
    } else {
      // Lógica de login permanece a mesma
      window.location.href =
        "http://localhost:3000/auth/google/init?redirect=" +
        encodeURIComponent(window.location.href);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      localStorage.setItem("jwtToken", urlToken);
      setToken(urlToken);
      setIsLoggedIn(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const storedToken = localStorage.getItem("jwtToken");
      if (storedToken) {
        setToken(storedToken);
        setIsLoggedIn(true);
      }
    }
  }, [searchParams]);

  const checkAuthStatus = useCallback(async () => {
    if (!token) return false;

    try {
      const response = await fetch("http://localhost:3000/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) return true;

      localStorage.removeItem("jwtToken");
      setToken(null);
      setIsLoggedIn(false);
      return false;
    } catch (error) {
      console.error("Error checking auth status:", error);
      return false;
    }
  }, [token]);

  const fetchEvents = useCallback(async () => {
    try {
      if (!token) return;

      const res = await fetch("http://localhost:3000/api/calendar", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("jwtToken");
        setToken(null);
        setIsLoggedIn(false);
        setError("Sua sessão expirou. Por favor, faça login novamente.");
        return;
      }

      if (!res.ok) {
        if (res.status === 404) {
          setError("Recurso não encontrado. Verifique a URL do calendário.");
        } else {
          setError(`Erro ao carregar eventos: ${res.statusText}`);
        }
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        setError("Formato de dados inválido recebido do servidor.");
        return;
      }

      setSummary(generateMonthlySummary(data as Event[]));
      setError(null); // Limpa erros anteriores se a requisição for bem-sucedida
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro inesperado ao carregar os eventos"
      );
    }
  }, [token]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const isAuthenticated = await checkAuthStatus();
        if (isAuthenticated) await fetchEvents();
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Falha ao inicializar a aplicação");
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [checkAuthStatus, fetchEvents]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Header onLogin={handleLogin} isLoggedIn={isLoggedIn} />

      {/* Exibe o erro de forma não intrusiva */}
      {error && (
        <div className="mb-6 p-4 bg-red-800/50 border border-red-500 rounded-lg">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-gray-300 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {isLoggedIn ? (
        summary.length > 0 ? (
          <MonthlySummarySection summary={summary} />
        ) : (
          <p className="text-center text-gray-300">
            {error ? "" : "Nenhum evento encontrado no calendário."}
          </p>
        )
      ) : (
        <p className="text-center text-gray-300">
          Faça login para visualizar seus eventos
        </p>
      )}
    </div>
  );
}

// ... (mantenha suas funções utilitárias existentes)

// Utility functions remain the same
const calculateTimeSpent = (start?: string, end?: string): number => {
  if (!start || !end) return 0;

  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return (endDate.getTime() - startDate.getTime()) / (1000 * 60);
  } catch {
    return 0;
  }
};

const generateMonthlySummary = (events: Event[]): MonthlySummary[] => {
  if (!Array.isArray(events)) {
    console.error("Error: events is not an array", events);
    return [];
  }

  const summaryMap: Record<string, MonthlySummary> = {};

  events.forEach((event) => {
    try {
      const startDate = new Date(
        event.start.dateTime || event.start.date || ""
      );
      if (isNaN(startDate.getTime())) return;

      const month = `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const task = event.summary;
      const timeSpent = calculateTimeSpent(
        event.start.dateTime || event.start.date,
        event.end.dateTime || event.end.date
      );

      if (!summaryMap[month]) {
        summaryMap[month] = { month, tasks: {} };
      }

      if (!summaryMap[month].tasks[task]) {
        summaryMap[month].tasks[task] = { totalTime: 0, count: 0 };
      }

      summaryMap[month].tasks[task].totalTime += timeSpent;
      summaryMap[month].tasks[task].count += 1;
    } catch (err) {
      console.error("Error processing event:", event, err);
    }
  });

  return Object.values(summaryMap);
};
