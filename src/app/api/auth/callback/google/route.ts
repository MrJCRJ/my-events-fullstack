// app/api/auth/callback/google/route.ts
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Código de autorização não fornecido" },
      { status: 400 }
    );
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Armazene os tokens em um cookie seguro
    const cookieStore = await cookies();
    cookieStore.set("google_tokens", JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // Use uma URL absoluta para o redirecionamento
    const redirectUrl = new URL("/", request.url).toString();
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Erro ao obter token:", error);
    return NextResponse.json({ error: "Erro ao obter token" }, { status: 500 });
  }
}
