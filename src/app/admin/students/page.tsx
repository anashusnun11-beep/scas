import { CaretRightIcon, UserPlusIcon, UsersIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { AccountChip, ListToolbar, Pager } from "@/components/admin/list-parts";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireRole } from "@/lib/auth/guard";
import { getStudentList, parseListQuery } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Manage students | SCAS" };

/** FR14 Manage Student Info: list and search (UI10, SD11 steps 1-6). */
export default async function StudentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireRole("ADMIN");
  const query = parseListQuery(await searchParams);
  const { total, rows } = await getStudentList(query);
  const add = (
    <Link href="/admin/students/new" className={buttonClasses()}>
      <UserPlusIcon aria-hidden className="size-4" />
      Add student
    </Link>
  );

  return (
    <div className="grid gap-4">
      <ListToolbar query={query} placeholder="Search student ID, name or e-mail" action={add} />
      {rows.length === 0 ? (
        <EmptyState icon={UsersIcon} title={query.q ? `No students match "${query.q}"` : "No students here"}>
          {query.q ? "Check the spelling, or search by student ID." : "Students appear here when they sign up or when you add them."}
        </EmptyState>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {rows.map((s) => (
              <li key={s.studentId}>
                <Link
                  href={`/admin/students/${encodeURIComponent(s.studentId)}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors duration-150 hover:bg-surface-2/60 md:grid-cols-[9rem_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <span className="col-start-1 row-start-1 font-mono text-sm font-semibold">{s.studentId}</span>
                  <span className="col-span-2 row-start-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
                    <span className="block truncate font-medium">{s.user.name}</span>
                    <span className="block truncate text-sm text-muted">{s.user.email}</span>
                  </span>
                  <span className="hidden truncate text-sm text-muted md:col-start-3 md:row-start-1 md:block">
                    {s.programme ?? "No programme"}
                    {s.semester ? `, sem ${s.semester}` : ""}
                  </span>
                  <span className="col-span-2 row-start-3 truncate text-sm md:col-span-1 md:col-start-4 md:row-start-1">
                    {s.lecturer ? s.lecturer.user.name : <span className="font-semibold text-accent-ink">No lecturer</span>}
                  </span>
                  <span className="col-start-2 row-start-1 flex items-center gap-2 justify-self-end md:col-start-5">
                    <AccountChip status={s.user.accountStatus} />
                    <CaretRightIcon aria-hidden className="size-4 text-muted" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Pager query={query} total={total} basePath="/admin/students" />
        </Card>
      )}
    </div>
  );
}
