import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/webmasters.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        console.log(`[NextAuth] Sending magic link to ${email}`);
        console.log(`[NextAuth] Magic Link URL: ${url}`);
        // Default send verification request behavior continues...
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log(`[NextAuth] SignIn Attempt: ${user.email} via ${account?.provider}`);
      return true;
    },
    async jwt({ token, account, user }) {
      if (user) {
        token.id = user.id;
      }
      if (account && account.provider === 'google') {
        console.log(`[NextAuth] Google Tokens received for: ${token.email}`);
        // We can handle extra token storage here later if needed, 
        // but let's first get the login stable.
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token.id) {
        // @ts-ignore
        session.user.id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    verifyRequest: '/login?verify=1',
  },
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };
