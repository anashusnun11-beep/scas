import { SignOutIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";

/** FR02 logout, at the bottom of the sidebar. A plain form, so it works before JS loads. */
export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" className="w-full justify-start text-muted hover:text-ink">
        <SignOutIcon aria-hidden className="size-5" />
        Log out
      </Button>
    </form>
  );
}
