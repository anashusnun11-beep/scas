import { EnvelopeSimpleIcon, MapPinIcon, PhoneIcon } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { LecturerDetails } from "@/server/queries/student";

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[1.25rem_5rem_1fr] items-start gap-2 py-2.5">
      <span className="mt-0.5 text-muted" aria-hidden>
        {icon}
      </span>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  );
}

/** FR03 View Lecturer Details: name, e-mail, department, office room, phone. */
export function LecturerCard({ lecturer, action }: { lecturer: LecturerDetails; action?: ReactNode }) {
  return (
    <Card>
      <CardHeader title="Lecturer" />
      <CardBody>
        <p className="font-display text-heading font-semibold">{lecturer.user.name}</p>
        <p className="text-sm text-muted">
          {[lecturer.position, lecturer.department].filter(Boolean).join(", ")}
        </p>
        <dl className="mt-3 divide-y divide-line">
          <Row icon={<EnvelopeSimpleIcon className="size-4" />} label="E-mail">
            <a href={`mailto:${lecturer.user.email}`} className="text-accent-ink underline-offset-2 hover:underline">
              {lecturer.user.email}
            </a>
          </Row>
          <Row icon={<MapPinIcon className="size-4" />} label="Office">
            {lecturer.officeRoom ?? "Not set"}
          </Row>
          <Row icon={<PhoneIcon className="size-4" />} label="Phone">
            {lecturer.user.phoneNo ? (
              <a href={`tel:${lecturer.user.phoneNo.replace(/[\s-]/g, "")}`} className="font-mono">
                {lecturer.user.phoneNo}
              </a>
            ) : (
              "Not set"
            )}
          </Row>
        </dl>
        {action && <div className="mt-4">{action}</div>}
      </CardBody>
    </Card>
  );
}
