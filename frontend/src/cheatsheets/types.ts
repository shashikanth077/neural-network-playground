import type { ReactNode } from "react";
import type { DomainId } from "../labs/domains";

export interface SheetSection {
  id: string;
  title: string;
  /** Extra words the search box matches besides the title. */
  keywords: string;
  render: () => ReactNode;
}

export interface Cheatsheet {
  id: string;
  domain: DomainId;
  title: string;
  subtitle: string;
  status: "live" | "planned";
  sections: SheetSection[];
}
