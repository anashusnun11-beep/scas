import { NotFoundView } from "@/components/layout/not-found-view";

/** 404 inside the signed-in area, so the sidebar stays. */
export default function AreaNotFound() {
  return <NotFoundView />;
}
