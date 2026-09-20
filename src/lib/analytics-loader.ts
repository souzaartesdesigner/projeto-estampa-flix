export function loadAnalytics(gaId: string | null, metaPixelId: string | null) {
  if (typeof window === 'undefined') return;

  const load = () => {
    if (gaId && !(window as any).gtag) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      script.async = true;
      document.head.appendChild(script);

      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
      (window as any).gtag = gtag;
      gtag('js', new Date());
      gtag('config', gaId);
    }
    
    if (metaPixelId && !(window as any).fbq) {
      const f = window as any;
      const b = document;
      const e = 'script';
      const v = 'https://connect.facebook.net/en_US/fbevents.js';
      
      if (f.fbq) return;
      const n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      } as any;
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      const t = b.createElement(e) as any;
      t.async = !0;
      t.src = v;
      const s = b.getElementsByTagName(e)[0];
      if (s && s.parentNode) s.parentNode.insertBefore(t, s);
      
      f.fbq('init', metaPixelId);
      f.fbq('track', 'PageView');
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(load);
  } else {
    setTimeout(load, 2000);
  }
}
