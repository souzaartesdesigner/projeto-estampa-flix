import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ARTWORK_COLS =
  "id,slug,title,preview_url,price_cents,license_type,is_featured,is_trending,download_count,translations,categories!artworks_category_id_fkey(id,name,slug,translations),artwork_categories(categories(id,name,slug,translations))";

export const homeQuery = queryOptions({
  queryKey: ["home-data"],
  queryFn: async () => {
    const nowIso = new Date().toISOString();
    const [
      { data: featured },
      { data: recent },
      { data: trending },
      { data: popular },
      { data: categories },
      { data: plans },
      { data: sections },
      { data: heroBanners },
      { data: middleBanners },
    ] = await Promise.all([
      supabase.from("artworks").select(ARTWORK_COLS).eq("is_published", true).eq("is_featured", true).order("featured_order", { ascending: true }).limit(12),
      supabase.from("artworks").select(ARTWORK_COLS).eq("is_published", true).order("created_at", { ascending: false }).limit(12),
      supabase.from("artworks").select(ARTWORK_COLS).eq("is_published", true).eq("is_trending", true).limit(8),
      supabase.from("artworks").select(ARTWORK_COLS).eq("is_published", true).order("download_count", { ascending: false }).limit(12),
      supabase.from("categories").select("id,slug,name,cover_url,translations,featured,sort_order").order("sort_order").order("name"),
      supabase.from("plans").select("*").eq("is_active", true).order("sort_order"),
      (supabase as any).from("home_sections").select("*").eq("is_active", true).order("sort_order"),
      (supabase as any).from("banners").select("*").eq("is_active", true).eq("position", "home_hero").order("sort_order"),
      (supabase as any).from("banners").select("*").eq("is_active", true).eq("position", "home_middle").order("sort_order"),
    ]);

    const filterWindow = (b: any) =>
      (!b.starts_at || b.starts_at <= nowIso) && (!b.ends_at || b.ends_at >= nowIso);

    const allCats = (categories ?? []) as any[];
    const seen = new Set<string>();
    const uniqueCats = allCats.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
    const featuredCats = uniqueCats.filter((c) => c.featured);
    const cats = (featuredCats.length > 0 ? featuredCats : uniqueCats).slice(0, 12);
    const artworkIdsForCategory = async (categoryId: string) => {
      const { data } = await supabase.from("artwork_categories").select("artwork_id").eq("category_id", categoryId);
      return Array.from(new Set((data ?? []).map((r: any) => r.artwork_id)));
    };

    const catsWithSamples = await Promise.all(
      cats.map(async (c) => {
        const ids = await artworkIdsForCategory(c.id);
        if (ids.length === 0) return { ...c, samples: [], count: 0 };
        const [{ data: samples }, { count }] = await Promise.all([
          supabase.from("artworks").select("id,preview_url,title,alt_text").eq("is_published", true).in("id", ids).order("created_at", { ascending: false }).limit(4),
          supabase.from("artworks").select("id", { count: "exact", head: true }).eq("is_published", true).in("id", ids),
        ]);
        return { ...c, samples: samples ?? [], count: count ?? 0 };
      })
    );

    // Prefetch items for "category"-typed sections
    const sectionsList = (sections ?? []) as any[];
    const categorySections = sectionsList.filter((s) => s.section_type === "category" && s.category_id);
    const catItemsEntries = await Promise.all(
      categorySections.map(async (s) => {
        const ids = await artworkIdsForCategory(s.category_id);
        if (ids.length === 0) return [s.id, []] as const;
        const { data } = await supabase
          .from("artworks")
          .select(ARTWORK_COLS)
          .eq("is_published", true)
          .in("id", ids)
          .order("created_at", { ascending: false })
          .limit(s.item_limit ?? 8);
        return [s.id, data ?? []] as const;
      })
    );
    const categoryItems: Record<string, any[]> = Object.fromEntries(catItemsEntries);


    // Prefetch items for "manual"-typed sections (manual curation)
    const manualSections = sectionsList.filter((s) => s.section_type === "manual");
    const manualItemsEntries = await Promise.all(
      manualSections.map(async (s) => {
        const { data: rows } = await (supabase as any)
          .from("home_section_items")
          .select(`sort_order, artwork:artworks(${ARTWORK_COLS}, is_published)`)
          .eq("section_id", s.id)
          .order("sort_order", { ascending: true })
          .limit(s.item_limit ?? 8);
        const items = ((rows ?? []) as any[])
          .map((r) => r.artwork)
          .filter((a) => a && a.is_published);
        return [s.id, items] as const;
      })
    );
    const manualItems: Record<string, any[]> = Object.fromEntries(manualItemsEntries);

    return {
      featured: featured ?? [],
      recent: recent ?? [],
      trending: trending ?? [],
      popular: popular ?? [],
      categories: catsWithSamples,
      plans: plans ?? [],
      sections: sectionsList,
      heroBanners: (heroBanners ?? []).filter(filterWindow),
      middleBanners: (middleBanners ?? []).filter(filterWindow),
      categoryItems,
      manualItems,
    };
  },
});
