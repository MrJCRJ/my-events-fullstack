// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { DefaultSession, TokenSet, Session, Account } from "next-auth";
import { JWT } from "next-auth/jwt"; // Import JWT from the correct module

// Extend the Session type to include accessToken and user ID
declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/auth",
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: Session; token: TokenSet }) {
      // Add accessToken to the session
      session.accessToken = token.accessToken as string | undefined;

      // Ensure the user object exists
      session.user = session.user || {};

      // Add the user ID to the session
      session.user.id = token.sub as string | undefined;

      return session;
    },
    async jwt({ token, account }: { token: JWT; account: Account | null }) {
      // Add the accessToken to the token
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
