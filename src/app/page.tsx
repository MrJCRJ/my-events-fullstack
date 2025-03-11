"use client";

import { useEffect, useState } from "react";

interface Event {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    date: string;
  };
  end: {
    dateTime: string;
    date: string;
  };
}

interface MonthlySummary {
  month: string; // Mês no formato "YYYY-MM"
  tasks: Record<string, { totalTime: number; count: number }>; // Tarefas e seus totais
}

const calculateTimeSpent = (start: string, end: string): number => {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return (endTime - startTime) / (1000 * 60); // Tempo em minutos
};

const generateMonthlySummary = (events: Event[]): MonthlySummary[] => {
  if (!Array.isArray(events)) {
    console.error("Erro: events não é um array", events);
    return [];
  }

  const summaryMap: Record<string, MonthlySummary> = {};

  events.forEach((event) => {
    const startDate = new Date(event.start.dateTime || event.start.date);
    const month = `${startDate.getFullYear()}-${String(
      startDate.getMonth() + 1
    ).padStart(2, "0")}`; // Formato "YYYY-MM"

    const task = event.summary;
    const timeSpent = calculateTimeSpent(
      event.start.dateTime || event.start.date,
      event.end.dateTime || event.end.date
    );

    if (!summaryMap[month]) {
      summaryMap[month] = {
        month,
        tasks: {},
      };
    }

    if (!summaryMap[month].tasks[task]) {
      summaryMap[month].tasks[task] = {
        totalTime: 0,
        count: 0,
      };
    }

    summaryMap[month].tasks[task].totalTime += timeSpent;
    summaryMap[month].tasks[task].count += 1;
  });

  return Object.values(summaryMap);
};

const Header = ({ onLogin }: { onLogin: () => void }) => (
  <header className="bg-gray-800 py-6 px-8 rounded-lg shadow-lg mb-8">
    <h1 className="text-3xl font-bold text-center text-gray-100">
      Eventos do Google Calendar
    </h1>
    <div className="text-center mt-4">
      <button
        onClick={onLogin}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
      >
        Login com Google
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
}) => (
  <div className="bg-gray-700 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
    <h4 className="text-lg font-semibold text-gray-100 mb-2">{task}</h4>
    <div className="space-y-2">
      <p className="text-gray-300">
        <span className="font-medium">Tempo total:</span>{" "}
        {details.totalTime.toFixed(2)} minutos
      </p>
      <p className="text-gray-300">
        <span className="font-medium">Realizado:</span> {details.count} vezes
      </p>
    </div>
  </div>
);

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

  const handleLogin = () => {
    window.location.href = "/api/auth";
  };

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/calendar");
        const data = await res.json();

        if (!Array.isArray(data)) {
          throw new Error("Erro: A resposta da API não é um array");
        }

        setSummary(generateMonthlySummary(data));
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        setError("Erro ao carregar eventos. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">{error}</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Header onLogin={handleLogin} />
      <MonthlySummarySection summary={summary} />
    </div>
  );
}
