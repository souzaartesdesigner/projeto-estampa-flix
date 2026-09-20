import type { ReactNode } from "react";

export function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function FilterOption({
  label,
  active,
  depth = 0,
  onClick,
}: {
  label: string;
  active: boolean;
  depth?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ paddingLeft: `${8 + depth * 12}px` }}
      className={`block w-full rounded-md py-1.5 pr-2 text-left text-sm transition-colors ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
