// Code /src/app/api/auth/status/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route"; // Importe authOptions corretamente

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ isLoggedIn: false }, { status: 200 });
  }

  return NextResponse.json({ isLoggedIn: true }, { status: 200 });
}
