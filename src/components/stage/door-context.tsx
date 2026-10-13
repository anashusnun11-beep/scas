"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type DoorApi = {
  /** The door is closed (SILA KETUK) until a login succeeds, then it opens (SILA MASUK). */
  open: boolean;
  openDoor: () => void;
  closeDoor: () => void;
};

const DoorContext = createContext<DoorApi | null>(null);

/** Shared by the door on the stage and the login form beside it. */
export function DoorProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const api = useMemo(() => ({ open, openDoor: () => setOpen(true), closeDoor: () => setOpen(false) }), [open]);
  return <DoorContext.Provider value={api}>{children}</DoorContext.Provider>;
}

export function useDoor() {
  const ctx = useContext(DoorContext);
  if (!ctx) throw new Error("useDoor must be used inside <DoorProvider>");
  return ctx;
}
