// Code /src/app/api/logout/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route"; // Importe authOptions corretamente

export async function GET() {
  const session = await getServerSession(authOptions);

  if (session) {
    // Lógica para encerrar a sessão
    return NextResponse.json({ success: true }, { status: 200 });
  }

  return NextResponse.json({ success: false }, { status: 401 });
}
