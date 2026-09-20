import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  cta?: { to: string; label: string };
  center?: boolean;
  icon?: ReactNode;
};

export function SectionTitle({ title, subtitle, cta, center, icon }: Props) {
  return (
    <div
      className={`mb-6 flex gap-3 sm:mb-8 sm:gap-4 ${
        center ? "flex-col items-center text-center" : "flex-col items-start sm:flex-row sm:items-end sm:justify-between"
      }`}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          {icon}
          <span>{title}</span>
        </h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{subtitle}</p>}
      </div>
      {cta && (
        <Link
          to={cta.to}
          className="group inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {cta.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
