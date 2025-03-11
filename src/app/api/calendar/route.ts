import { google } from "googleapis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

interface GoogleCalendarEvent {
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

interface GoogleApiCalendarEvent {
  id?: string | null; // `id` agora é opcional
  summary?: string | null; // `summary` também é opcional
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

function mapGoogleEventToCalendarEvent(
  event: GoogleApiCalendarEvent
): GoogleCalendarEvent {
  return {
    id: event.id || "", // Garante que `id` seja uma string
    summary: event.summary || "Sem título", // Garante que `summary` seja uma string
    start: {
      dateTime: event.start?.dateTime,
      date: event.start?.date,
    },
    end: {
      dateTime: event.end?.dateTime,
      date: event.end?.date,
    },
  };
}

export async function GET() {
  const cookieStore = await cookies(); // Agora é assíncrono
  const tokensValue = cookieStore.get("google_tokens")?.value;

  if (!tokensValue) {
    return NextResponse.json(
      { error: "Token de autenticação não encontrado" },
      { status: 401 }
    );
  }

  const tokens: GoogleTokens = JSON.parse(tokensValue);

  if (!tokens.access_token || tokens.expiry_date < Date.now()) {
    return NextResponse.json(
      { error: "Token de autenticação inválido ou expirado" },
      { status: 401 }
    );
  }

  oauth2Client.setCredentials(tokens);

  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Definir o intervalo de datas do ano atual
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString(); // 1º de janeiro do ano atual
    const endOfYear = new Date(new Date().getFullYear(), 11, 31).toISOString(); // 31 de dezembro do ano atual

    let allEvents: GoogleCalendarEvent[] = [];
    let pageToken: string | undefined;

    do {
      const res = await calendar.events.list({
        calendarId: "primary",
        timeMin: startOfYear,
        timeMax: endOfYear,
        maxResults: 2500,
        singleEvents: true,
        orderBy: "startTime",
        pageToken: pageToken, // Token de paginação
      });

      if (res.data.items) {
        const mappedEvents = res.data.items.map((event) =>
          mapGoogleEventToCalendarEvent(event as GoogleApiCalendarEvent)
        );
        allEvents = allEvents.concat(mappedEvents);
      }

      pageToken = res.data.nextPageToken || undefined;
    } while (pageToken);

    return NextResponse.json(allEvents);
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar eventos",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
