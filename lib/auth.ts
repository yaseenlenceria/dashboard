import { AuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";

export const authOptions: AuthOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_APP_CLIENT_ID!,
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      const allowedEmails = (process.env.ALLOWED_EMAILS || "")
        .split(",")
        .map(email => email.trim().toLowerCase())
        .filter(Boolean);
      
      if (allowedEmails.length === 0) {
        console.warn("No ALLOWED_EMAILS configured - allowing all users");
        return true;
      }
      
      const email = (user?.email || "").toLowerCase();
      const isAllowed = allowedEmails.includes(email);
      
      if (!isAllowed) {
        console.log(`Access denied for email: ${email}`);
      }
      
      return isAllowed;
    },
    async session({ session, token }) {
      return session;
    },
    async jwt({ token, user, account }) {
      return token;
    }
  },
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  }
};