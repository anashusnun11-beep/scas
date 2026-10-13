import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { burnPasswordCheck, verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validation/auth";
import { prisma } from "@/server/db";

/** Deactivated accounts (BR8) get their own message instead of "wrong password". */
export class InactiveAccountError extends CredentialsSignin {
  code = "inactive";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      // SD1 steps 12-16: getUserByEmail, verifyPassword, createSession(userId, role)
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, name: true, email: true, passwordHash: true, role: true, accountStatus: true },
        });
        if (!user) {
          await burnPasswordCheck(password);
          return null;
        }
        if (!(await verifyPassword(password, user.passwordHash))) return null;
        if (user.accountStatus !== "ACTIVE") throw new InactiveAccountError();

        return { id: String(user.id), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
