import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  site_name: string;
  tagline: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  support_email: string | null;
  whatsapp: string | null;
  whatsapp_message: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  ga4_measurement_id: string | null;
  meta_pixel_id: string | null;
  google_search_console_id: string | null;
  footer_text: string | null;
  legal_business_name: string | null;
  legal_document: string | null;
  promo_banner_enabled: boolean;
  promo_banner_text: string | null;
  promo_banner_link: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  head_scripts: string | null;
  robots_txt: string | null;
  sitemap_enabled: boolean;
  sitemap_extra_paths: string | null;
  home_seo_title: string | null;
  home_seo_description: string | null;
  home_og_image_url: string | null;
  plans_seo_title: string | null;
  plans_seo_description: string | null;
  plans_seo_keyword: string | null;
  blog_seo_title: string | null;
  blog_seo_description: string | null;
  blog_seo_keyword: string | null;
};

const DEFAULTS: SiteSettings = {
  site_name: "Estampa Flix",
  tagline: "Artes digitais para sublimação",
  logo_url: null,
  favicon_url: null,
  primary_color: "#007bff",
  support_email: null,
  whatsapp: null,
  whatsapp_message: null,
  instagram_url: null,
  facebook_url: null,
  tiktok_url: null,
  ga4_measurement_id: null,
  meta_pixel_id: null,
  google_search_console_id: null,
  footer_text: null,
  legal_business_name: null,
  legal_document: null,
  promo_banner_enabled: false,
  promo_banner_text: null,
  promo_banner_link: null,
  seo_title: null,
  seo_description: null,
  seo_keywords: null,
  og_title: null,
  og_description: null,
  og_image_url: null,
  head_scripts: null,
  robots_txt: null,
  sitemap_enabled: true,
  sitemap_extra_paths: null,
  home_seo_title: null,
  home_seo_description: null,
  home_og_image_url: null,
  plans_seo_title: null,
  plans_seo_description: null,
  plans_seo_keyword: null,
  blog_seo_title: null,
  blog_seo_description: null,
  blog_seo_keyword: null,
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data } = await (supabase as any).from("site_settings").select("*").eq("id", true).maybeSingle();
      return { ...DEFAULTS, ...(data ?? {}) };
    },
    staleTime: 60_000,
  });
}
