"use client";

import { useEffect, useState } from "react";

interface Event {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    date: string;
  };
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);

  const handleLogin = () => {
    window.location.href = "/api/auth";
  };

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/calendar");
        const data = await res.json();
        setEvents(data);
      } catch (error) {
        console.error("Erro:", error);
      }
    }

    fetchEvents();
  }, []);

  return (
    <div>
      <h1>Eventos do Google Calendar</h1>
      <button onClick={handleLogin}>Login com Google</button>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            {event.summary} - {event.start.dateTime || event.start.date}
          </li>
        ))}
      </ul>
    </div>
  );
}
