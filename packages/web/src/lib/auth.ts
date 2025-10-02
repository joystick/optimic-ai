import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyOTP } from "./cognito";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
        session: { label: "Session", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp || !credentials?.session) {
          throw new Error("Missing credentials");
        }

        const result = await verifyOTP(
          credentials.email,
          credentials.otp,
          credentials.session
        );

        if (result.success && result.accessToken) {
          return {
            id: credentials.email,
            email: credentials.email,
            accessToken: result.accessToken,
            idToken: result.idToken,
            refreshToken: result.refreshToken,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.idToken = (user as any).idToken;
        token.refreshToken = (user as any).refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      // session.user = {
      //   ...session.user,
      //   id: token.sub!,
      // };
      (session as any).accessToken = token.accessToken;
      (session as any).idToken = token.idToken;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
};
