import { useSiteSettings } from "@/hooks/use-site-settings";
import { useSiteContent } from "@/hooks/use-site-content";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

export function PromoBanner() {
  const { data } = useSiteSettings();
  const cms = useSiteContent("header_notice");
  const text = cms?.title || data?.promo_banner_text || "";
  const link = cms?.content || data?.promo_banner_link || "";
  const [dismissed, setDismissed] = useState(true); // Default to true to avoid hydration mismatch

  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = `promo-dismissed-${text}`;
      setDismissed(sessionStorage.getItem(key) === "1");
    } else {
      setDismissed(false); // On server, we want to render it if enabled
    }
  }, [text]);

  if (!data?.promo_banner_enabled || !text || dismissed) return null;

  const content = (
    <>
      <span className="flex-1 text-center">{text}</span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDismissed(true);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(`promo-dismissed-${text}`, "1");
          }
        }}
        className="p-1 opacity-80 hover:opacity-100"
        aria-label="Fechar"
      >
        <X className="h-3 w-3" />
      </button>
    </>
  );

  const className = "flex min-h-[44px] items-center gap-2 bg-gradient-brand px-4 py-2 text-xs font-medium text-brand-foreground sm:text-sm";

  if (link) {
    return <a href={link} className={className}>{content}</a>;
  }
  return <div className={className}>{content}</div>;
}
