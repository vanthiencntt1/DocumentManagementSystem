import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import fs from "fs"
import path from "path"

const getUsers = () => {
  const filePath = path.join(process.cwd(), 'data', 'users.json')
  if (!fs.existsSync(filePath)) return []
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock',
    }),
    CredentialsProvider({
      name: 'Tài khoản nội bộ',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@congty.com" },
        password: { label: "Mật khẩu", type: "password", placeholder: "123" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const users = getUsers();
        const user = users.find(u => u.email === credentials.email && u.password === credentials.password)
        if (user) return { id: user.email, name: user.name, email: user.email, role: user.role }
        return null; // Return null if user not found or password incorrect
      }
    })
  ],
  pages: {
    signIn: '/login', // Use our custom login page
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') return true;
      const users = getUsers();
      return users.some(u => u.email === user.email);
    },
    async jwt({ token, user }) {
      if (user) {
        const users = getUsers()
        const dbUser = users.find(u => u.email === user.email)
        token.role = dbUser?.role || 'viewer'
      }
      return token
    },
    async session({ session, token }) {
      if(session?.user) {
          session.user.role = token.role
      }
      return session
    }
  },
  session: { strategy: "jwt" },
}
