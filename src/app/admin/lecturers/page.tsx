import { CaretRightIcon, ChalkboardTeacherIcon, UserPlusIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountChip, ListToolbar, Pager } from "@/components/admin/list-parts";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guard";
import { getLecturerList, parseListQuery } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Manage lecturers | SCAS" };

/** FR15 Manage Lecturer Info: list and search (SD12 steps 1-6). */
export default async function LecturersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole("ADMIN");
  const query = parseListQuery(await searchParams);
  const { total, rows } = await getLecturerList(query);
  const add = (
    <Link href="/admin/lecturers/new" className={buttonClasses()}>
      <UserPlusIcon aria-hidden className="size-4" />
      Add lecturer
    </Link>
  );

  return (
    <div className="grid gap-4">
      <ListToolbar query={query} placeholder="Search lecturer ID, name, e-mail or department" action={add} />
      {rows.length === 0 ? (
        <EmptyState icon={ChalkboardTeacherIcon} title={query.q ? `No lecturers match "${query.q}"` : "No lecturers here"}>
          {query.q ? "Check the spelling, or search by lecturer ID." : "Add a lecturer so students can book consultations with them."}
        </EmptyState>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {rows.map((l) => (
              <li key={l.lecturerId}>
                <Link
                  href={`/admin/lecturers/${encodeURIComponent(l.lecturerId)}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors duration-150 hover:bg-surface-2/60 md:grid-cols-[7rem_minmax(0,1.4fr)_minmax(0,1fr)_8rem_auto]"
                >
                  <span className="col-start-1 row-start-1 font-mono text-sm font-semibold">{l.lecturerId}</span>
                  <span className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
                    <span className="block truncate font-medium">{l.user.name}</span>
                    <span className="block truncate text-sm text-muted">{l.user.email}</span>
                  </span>
                  <span className="col-span-2 row-start-3 truncate text-sm text-muted md:col-span-1 md:col-start-3 md:row-start-1">
                    {l.department ?? "No department"}
                    {l.officeRoom ? `, ${l.officeRoom}` : ""}
                  </span>
                  <span className="col-span-2 row-start-4 text-sm md:col-span-1 md:col-start-4 md:row-start-1">
                    {l._count.appointments} appointment{l._count.appointments === 1 ? "" : "s"}
                  </span>
                  <span className="col-start-2 row-start-1 flex items-center gap-2 justify-self-end md:col-start-5">
                    <AccountChip status={l.user.accountStatus} />
                    <CaretRightIcon aria-hidden className="size-4 text-muted" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Pager query={query} total={total} basePath="/admin/lecturers" />
        </Card>
      )}
    </div>
  );
}
