"use client";
import { useEffect } from "react";

/**
 * On phones, admin tables are shown as stacked cards. This copies each column heading onto its cells
 * (data-label) so every value keeps its label. Re-runs when rows change (search, live updates).
 */
export default function TableLabels() {
  useEffect(() => {
    const label = () =>
      document.querySelectorAll<HTMLTableElement>(".adm table.tbl").forEach((t) => {
        const heads = Array.from(t.querySelectorAll("thead th")).map((th) => th.textContent?.trim() ?? "");
        t.querySelectorAll("tbody tr").forEach((tr) =>
          Array.from(tr.children).forEach((td, i) => {
            const el = td as HTMLElement;
            const h = el.hasAttribute("colspan") ? "" : heads[i] ?? "";
            if ((el.dataset.label ?? "") !== h) { if (h) el.dataset.label = h; else delete el.dataset.label; }
          }),
        );
      });
    label();
    const mo = new MutationObserver(label);
    mo.observe(document.body, { subtree: true, childList: true });
    return () => mo.disconnect();
  }, []);
  return null;
}
