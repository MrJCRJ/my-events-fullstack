// src/app/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import MonthlySummarySection from "@/components/MonthlySummarySection";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";
import { Event, MonthlySummary } from "@/app/types/types";

export default function Home() {
  const [summary, setSummary] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | undefined>(undefined);
  const { data: session } = useSession();

  const handleLogin = () => {
    if (isLoggedIn) {
      // Lógica para logout
      window.location.href = "/api/auth";
    } else {
      // Lógica para login
      window.location.href = "/api/auth";
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/calendar", {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!res.ok) throw new Error(`Erro ${res.status}: Falha na API`);

      const data = await res.json();
      if (!Array.isArray(data))
        throw new Error("Erro: A resposta da API não é um array");

      setSummary(generateMonthlySummary(data));
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  const checkLoginStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status");
      if (!res.ok) throw new Error(`Erro ${res.status}: Falha na API`);

      const data = await res.json();
      setIsLoggedIn(data.isLoggedIn);

      if (data.isLoggedIn) {
        fetchEvents();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Erro ao verificar status de login:", error);
      setError("Não foi possível verificar o status de login.");
      setLoading(false);
    }
  }, [fetchEvents]);

  useEffect(() => {
    if (session?.accessToken) {
      checkLoginStatus();
    } else {
      setLoading(false);
    }
  }, [session?.accessToken, checkLoginStatus]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Header onLogin={handleLogin} isLoggedIn={isLoggedIn} />
      {isLoggedIn ? (
        <MonthlySummarySection summary={summary} />
      ) : (
        <p className="text-center text-gray-300">
          Faça login para visualizar seus eventos.
        </p>
      )}
    </div>
  );
}

// Funções utilitárias
const calculateTimeSpent = (start?: string, end?: string): number => {
  if (!start || !end) return 0;
  return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60);
};

const generateMonthlySummary = (events: Event[]): MonthlySummary[] => {
  if (!Array.isArray(events)) {
    console.error("Erro: events não é um array", events);
    return [];
  }

  const summaryMap: Record<string, MonthlySummary> = {};

  events.forEach((event) => {
    const startDate = new Date(event.start.dateTime || event.start.date || "");
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
  });

  return Object.values(summaryMap);
};
