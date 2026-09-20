import { formatLabel } from "./formats";

type Props = { format: string; className?: string };

/**
 * Badge textual padronizado para formatos de arquivo.
 * Mesmo estilo usado no painel "Informações do produto".
 */
export function FileFormatIcon({ format, className = "" }: Props) {
  const label = formatLabel(format);
  return (
    <span
      className={
        "inline-flex items-center rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary " +
        className
      }
    >
      {label}
    </span>
  );
}
