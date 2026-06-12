import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";

export type ShellTab =
  | "discover"
  | "saved"
  | "upload"
  | "backed"
  | "profile"
  | "admin"
  | "none"
  | "home"
  | "practice"
  | "activity";

export function AppShell({
  children,
  active,
}: {
  children: ReactNode;
  active: ShellTab;
}) {
  return (
    <div className="mobile-shell">
      <main className="screen-content">{children}</main>
      <BottomNav active={active} />
    </div>
  );
}

export function BareShell({ children }: { children: ReactNode }) {
  return (
    <div className="mobile-shell">
      <main className="screen-content-bare">{children}</main>
    </div>
  );
}
