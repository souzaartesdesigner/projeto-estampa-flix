import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArtworkCard } from "@/components/artwork-card";
import { useI18n } from "@/lib/i18n";

export function RelatedArtworks({ categoryIds, currentId }: { categoryIds: string[]; currentId: string }) {
  const { t } = useI18n();
  const { data } = useQuery({
    queryKey: ["related-artworks", categoryIds, currentId],
    enabled: categoryIds.length > 0,
    queryFn: async () => {
      const { data: links } = await supabase
        .from("artwork_categories")
        .select("artwork_id")
        .in("category_id", categoryIds);
      const ids = Array.from(new Set((links ?? []).map((l: any) => l.artwork_id))).filter((id) => id !== currentId);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("artworks")
        .select("id,slug,title,preview_url,price_cents,license_type,is_featured,is_trending,download_count,translations,categories!artworks_category_id_fkey(id,name,slug,translations),artwork_categories(categories(id,name,slug,translations))")
        .eq("is_published", true)
        .in("id", ids)
        .order("download_count", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  if (categoryIds.length === 0 || !data || data.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl font-bold">{t("product.related")}</h2>
        <Link to="/catalogo" search={{ page: 1 }} className="text-sm text-primary hover:underline">{t("product.seeMore")}</Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {data.map((a: any) => (
          <ArtworkCard key={a.id} artwork={a} />
        ))}
      </div>
    </section>
  );
}
