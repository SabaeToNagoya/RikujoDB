import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.password) return null;
        if (credentials.password === process.env.ADMIN_PASSWORD) {
          return { id: "1", name: "管理者", email: "admin@rikujodb.local" };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) session.user.name = "管理者";
      return session;
    },
  },
};
