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
  id?: string | null;
  summary?: string | null;
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
    id: event.id || "",
    summary: event.summary || "Sem título",
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
  const cookieStore = await cookies(); // Acesso síncrono aos cookies
  const tokensValue = cookieStore.get("google_tokens")?.value;

  if (!tokensValue) {
    return NextResponse.json(
      { error: "Token de autenticação não encontrado" },
      { status: 401 }
    );
  }

  let tokens: GoogleTokens = JSON.parse(tokensValue);

  if (tokens.expiry_date < Date.now() && tokens.refresh_token) {
    try {
      // Renova o token corretamente
      const newTokens = await oauth2Client.getAccessToken();

      if (!newTokens.token) {
        throw new Error("Falha ao obter novo access token");
      }

      oauth2Client.setCredentials({
        access_token: newTokens.token,
        expiry_date: Date.now() + 3600 * 1000, // 1 hora
      });

      // Atualiza os tokens no cookie
      const updatedTokens = {
        ...tokens,
        access_token: newTokens.token,
        expiry_date: Date.now() + 3600 * 1000,
      };

      // Obtém os cookies corretamente antes de atualizar
      const cookieStore = await cookies();
      await cookieStore.set("google_tokens", JSON.stringify(updatedTokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });

      tokens = updatedTokens;
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      return NextResponse.json(
        { error: "Erro ao renovar token de autenticação" },
        { status: 401 }
      );
    }
  }

  if (!tokens.access_token || tokens.expiry_date < Date.now()) {
    return NextResponse.json(
      { error: "Token de autenticação inválido ou expirado" },
      { status: 401 }
    );
  }

  oauth2Client.setCredentials(tokens);

  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endOfYear = new Date(new Date().getFullYear(), 11, 31).toISOString();

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
        pageToken: pageToken,
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
