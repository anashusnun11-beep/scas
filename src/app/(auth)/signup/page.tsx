import type { Metadata } from "next";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Sign up | SCAS" };

export default function SignupPage() {
  return (
    <div className="grid gap-6">
      <AuthTabs />
      <SignupForm />
    </div>
  );
}
