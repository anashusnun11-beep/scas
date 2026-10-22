"use client";

import { SignOutIcon } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { logoutAction, signOutAction } from "@/server/actions/auth";

/**
 * FR02 logout, at the bottom of the sidebar. With JavaScript it ends the session, then does a full page
 * load of /login: Cache Components keeps visited pages alive in memory, and a soft navigation would bring
 * back the last login form (e-mail filled in, door open). `replace` also keeps Back from returning to the app.
 * Without JavaScript the plain form posts to logoutAction, which redirects on the server.
 */
export function LogoutButton() {
  const [leaving, setLeaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLeaving(true);
    try {
      await signOutAction();
    } finally {
      window.location.replace("/login");
    }
  }

  return (
    <form action={logoutAction} onSubmit={onSubmit}>
      <Button type="submit" variant="ghost" loading={leaving} className="w-full justify-start text-muted hover:text-ink">
        {!leaving && <SignOutIcon aria-hidden className="size-5" />}
        Log out
      </Button>
    </form>
  );
}
