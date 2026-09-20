UPDATE public.site_settings 
SET 
  ga4_measurement_id = NULL,
  google_ads_id = NULL,
  google_ads_purchase_label = NULL,
  meta_pixel_id = NULL,
  head_scripts = '<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-MF4NNDGFSH"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag(''js'', new Date());

  gtag(''config'', ''G-MF4NNDGFSH'');
</script>',
  body_scripts = '<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-594LSV6J"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->'
WHERE id = true;