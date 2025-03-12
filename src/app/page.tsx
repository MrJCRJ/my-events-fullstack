"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Event {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

interface MonthlySummary {
  month: string;
  tasks: Record<string, { totalTime: number; count: number }>;
}

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

const Header = ({
  onLogin,
  isLoggedIn,
}: {
  onLogin: () => void;
  isLoggedIn: boolean;
}) => (
  <header className="bg-gray-800 py-6 px-8 rounded-lg shadow-lg mb-8">
    <h1 className="text-3xl font-bold text-center text-gray-100">
      Eventos do Google Calendar
    </h1>
    <div className="text-center mt-4">
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
    </div>
  </header>
);

const TaskCard = ({
  task,
  details,
}: {
  task: string;
  details: { totalTime: number; count: number };
}) => {
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes.toFixed(0)} minutos`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes.toFixed(0)}min`;
  };

  return (
    <div className="bg-gray-700 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
      <h4 className="text-lg font-semibold text-gray-100 mb-2">{task}</h4>
      <div className="space-y-2">
        <p className="text-gray-300">
          <span className="font-medium">Tempo total:</span>{" "}
          {formatTime(details.totalTime)}
        </p>
        <p className="text-gray-300">
          <span className="font-medium">Realizado:</span> {details.count} vezes
        </p>
      </div>
    </div>
  );
};

const MonthlySummarySection = ({ summary }: { summary: MonthlySummary[] }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold text-gray-100 mb-6">Resumo Mensal</h2>
    {summary.map((monthSummary) => (
      <div
        key={monthSummary.month}
        className="bg-gray-800 p-6 rounded-lg shadow-lg mb-6"
      >
        <h3 className="text-xl font-semibold text-gray-200 mb-4">
          Mês: {monthSummary.month}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(monthSummary.tasks).map(([task, details]) => (
            <TaskCard key={task} task={task} details={details} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default function Home() {
  const [summary, setSummary] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | undefined>(undefined);
  const { data: session } = useSession();

  const handleLogin = () => {
    if (isLoggedIn) {
      // Lógica para logout
      window.location.href = "/api/auth/signout";
    } else {
      // Lógica para login
      window.location.href = "/api/auth/signin";
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      console.log("Fetching events..."); // Log para depuração
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
  }, [session?.accessToken]); // Adiciona session?.accessToken como dependência

  const checkLoginStatus = useCallback(async () => {
    try {
      console.log("Checking login status..."); // Log para depuração
      const res = await fetch("/api/auth/status");
      if (!res.ok) throw new Error(`Erro ${res.status}: Falha na API`);

      const data = await res.json();
      setIsLoggedIn(data.isLoggedIn);

      // Se o usuário estiver logado, buscar os eventos
      if (data.isLoggedIn) {
        console.log("User is logged in. Fetching events..."); // Log para depuração
        fetchEvents();
      } else {
        console.log("User is not logged in."); // Log para depuração
        setLoading(false); // Se não estiver logado, parar o carregamento
      }
    } catch (error) {
      console.error("Erro ao verificar status de login:", error);
      setError("Não foi possível verificar o status de login.");
      setLoading(false);
    }
  }, [fetchEvents]); // Adiciona fetchEvents como dependência

  useEffect(() => {
    if (session?.accessToken) {
      // Só chama checkLoginStatus se houver um accessToken
      checkLoginStatus();
    } else {
      setLoading(false); // Se não houver accessToken, para o carregamento
    }
  }, [session?.accessToken, checkLoginStatus]); // Adiciona session?.accessToken como dependência

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center items-center">
        <div className="border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center items-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Header onLogin={handleLogin} isLoggedIn={isLoggedIn ?? false} />
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
