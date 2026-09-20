import { useState } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { FloatingSupport } from "./floating-support";
import { CookieBanner } from "./cookie-banner";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SiteLayout({ children }: { children: ReactNode }) {
  const [cookieVisible, setCookieVisible] = useState(false);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className={cn("flex-1", cookieVisible && "pb-36 sm:pb-32")}>
        {children}
      </main>
      <SiteFooter />
      <FloatingSupport />
      <CookieBanner onShowChange={setCookieVisible} />
    </div>
  );
}
