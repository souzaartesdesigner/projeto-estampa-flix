import { ArtworkCard } from "@/components/artwork-card";

export function ArtGrid({ items, emptyMsg }: { items: any[]; emptyMsg: string }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
        {emptyMsg}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
      {items.map((a) => <ArtworkCard key={a.id} artwork={a} />)}
    </div>
  );
}
