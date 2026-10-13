import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { LoginForm, type LoginNotice } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in | SCAS" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Reads the query string, so it streams in behind Suspense (Cache Components). */
async function LoginWithParams({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const callbackUrl = first(params.callbackUrl);
  let notice: LoginNotice | undefined;
  if (first(params.registered)) notice = { tone: "success", text: "Account created. Log in with your e-mail and password." };
  else if (first(params.reason) || callbackUrl) notice = { tone: "info", text: "Your session has ended. Please log in again." };
  return <LoginForm callbackUrl={callbackUrl} notice={notice} />;
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="grid gap-6">
      <AuthTabs />
      {/* The fallback is the same form without notices, so the static shell is already usable. */}
      <Suspense fallback={<LoginForm />}>
        <LoginWithParams searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
