import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

// Use the global prisma instance if available to prevent connection exhaustion in dev
const prisma = new PrismaClient();

const handler = NextAuth({
  // adapter: PrismaAdapter(prisma), // Disabled to prevent login loop
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
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        // Manually sync user to DB so we have a record
        const dbUser = await prisma.user.upsert({
          where: { email: user.email! },
          update: { name: user.name, image: user.image },
          create: { 
            email: user.email!, 
            name: user.name, 
            image: user.image 
          },
        });

        // Manually save the tokens to the Account table for GSC API usage
        await prisma.account.upsert({
          where: { 
            provider_providerAccountId: {
              provider: 'google',
              providerAccountId: account.providerAccountId
            }
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            scope: account.scope,
            token_type: account.token_type,
            id_token: account.id_token
          },
          create: {
            userId: dbUser.id,
            type: account.type,
            provider: 'google',
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            scope: account.scope,
            token_type: account.token_type,
            id_token: account.id_token
          }
        });

        token.id = dbUser.id;
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
  debug: true,
});

export { handler as GET, handler as POST };
