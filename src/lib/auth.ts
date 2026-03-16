import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id;
        (session.user as any).role = (user as any).role;
      }
      return session;
    },
    async signIn({ user }) {
      // Only allow the admin email to sign in
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
      const userEmail = user.email?.toLowerCase();
      console.log("Sign-in attempt:", { userEmail, adminEmail });
      if (adminEmail && userEmail !== adminEmail) {
        return false;
      }
      // Set admin role on first sign in
      if (userEmail && userEmail === adminEmail) {
        await prisma.user.updateMany({
          where: { email: user.email! },
          data: { role: "admin" },
        });
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "database",
  },
};
