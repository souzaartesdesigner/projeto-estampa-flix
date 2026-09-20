export function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function brlToCents(brl: string | number): number {
  if (typeof brl === "number") return Math.round(brl * 100);
  const clean = brl.replace("R$", "").replace(/\s/g, "").replace(".", "").replace(",", ".");
  const value = parseFloat(clean);
  return isNaN(value) ? 0 : Math.round(value * 100);
}

export function centsToBRLInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}


export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatDate(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}
