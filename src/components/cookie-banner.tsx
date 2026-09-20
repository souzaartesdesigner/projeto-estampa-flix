import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const STORAGE_KEY = "estampahub_cookie_consent_v1";

interface CookieBannerProps {
  onShowChange?: (show: boolean) => void;
}

export function CookieBanner({ onShowChange }: CookieBannerProps) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setShow(true);
        onShowChange?.(true);
      }
    } catch {}
  }, [onShowChange]);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, at: new Date().toISOString() }));
    } catch {}
    setShow(false);
    onShowChange?.(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label={t("cookies.title")}
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-border/60 bg-card/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-lg sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md sm:rounded-2xl sm:p-4 sm:pb-4"
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary sm:h-9 sm:w-9">
          <Cookie className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{t("cookies.title")}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("cookies.body")}{" "}
            <Link to="/privacidade" className="text-primary underline">
              {t("cookies.readMore")}
            </Link>
            .
          </p>
          <div className="mt-2 flex flex-wrap gap-2 sm:mt-3">
            <Button size="sm" className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90" onClick={accept}>
              {t("cookies.accept")}
            </Button>
          </div>
        </div>
        <button
          onClick={accept}
          aria-label={t("cookies.close")}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
