import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { CmsPage } from "@/components/cms-page";

export const Route = createFileRoute("/licenca")({
  head: () => ({
    meta: [
      { title: "Licença de Uso Comercial — Estampa Flix" },
      { name: "description", content: "Entenda os direitos e limites da licença comercial vitalícia que acompanha cada arte digital baixada no Estampa Flix." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Licença de Uso Comercial — Estampa Flix" },
      { property: "og:description", content: "Direitos, permissões e restrições da licença comercial das artes do Estampa Flix." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://estampaflix.com/licenca" },
      { name: "keywords", content: "licença comercial artes digitais, uso comercial sublimação, direitos de uso estampas" },
    ],
    links: [{ rel: "canonical", href: "https://estampaflix.com/licenca" }],
  }),
  component: LicensePage,
});

function LicensePage() {
  return (
    <SiteLayout>
      <CmsPage contentKey="page_licenca" defaultTitle="Licença de Uso Comercial">
        <>

        <p className="mb-6">
          Toda arte digital baixada no Estampa Flix — seja através de créditos da assinatura ou de compra avulsa via Pix —
          acompanha automaticamente uma <strong>Licença Comercial Vitalícia</strong>, nos termos descritos abaixo. Ao
          realizar o download, você concorda integralmente com estas condições.
        </p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">1. Resumo da licença</h2>
        <ul className="mb-4 list-disc space-y-1 pl-6">
          <li><strong>Tipo:</strong> não-exclusiva, mundial, intransferível e vitalícia.</li>
          <li><strong>Uso:</strong> pessoal <em>e</em> comercial, sem limite de unidades produzidas.</li>
          <li><strong>Titular:</strong> o cliente cadastrado que efetuou o download.</li>
          <li><strong>Custo adicional:</strong> nenhum — a licença já está incluída no valor pago.</li>
        </ul>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">2. O que você PODE fazer</h2>
        <ul className="mb-4 list-disc space-y-1 pl-6">
          <li>Estampar as artes em produtos físicos que você produz e vende: camisetas, canecas, almofadas, quadros, adesivos, chinelos, bonés, azulejos, capinhas, cadernos e afins.</li>
          <li>Utilizar em sublimação, DTF, DTG, silk-screen, corte a laser, impressão em vinil e outras técnicas de estamparia.</li>
          <li>Modificar, editar, redimensionar, recortar e combinar as artes com outros elementos para criar novas composições.</li>
          <li>Vender os produtos físicos finalizados em lojas físicas, e-commerces, marketplaces (Shopee, Mercado Livre, Amazon, Elo7 etc.) e redes sociais.</li>
          <li>Usar as artes em materiais de divulgação dos <em>seus próprios</em> produtos (fotos de catálogo, anúncios pagos, redes sociais).</li>
          <li>Produzir quantidade ilimitada de unidades — não há teto de tiragem.</li>
        </ul>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">3. O que você NÃO PODE fazer</h2>
        <ul className="mb-4 list-disc space-y-1 pl-6">
          <li><strong>Revender, doar ou compartilhar</strong> o arquivo digital original (PNG, JPG, PDF, PSD etc.), mesmo modificado, como arquivo digital para terceiros.</li>
          <li><strong>Redistribuir</strong> as artes em bancos de imagens, packs, drives compartilhados, grupos de Telegram/WhatsApp, marketplaces de arquivos digitais ou plataformas concorrentes.</li>
          <li><strong>Sublicenciar</strong> ou repassar os direitos desta licença para outra pessoa ou empresa.</li>
          <li><strong>Reivindicar autoria</strong> original das artes ou registrá-las como marca/obra de sua autoria no INPI ou órgão equivalente.</li>
          <li>Utilizar as artes em conteúdo ilegal, ofensivo, discriminatório, difamatório, pornográfico ou que viole direitos de terceiros.</li>
          <li>Utilizar as artes em serviços de <strong>impressão sob demanda (POD)</strong> em plataformas onde a arte fica hospedada como arquivo baixável (ex.: Redbubble, Teespring). Uso em POD é permitido apenas quando <em>você</em> é quem produz e envia o produto físico.</li>
        </ul>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">4. Marcas e personagens de terceiros</h2>
        <p className="mb-4">
          Algumas artes podem conter representações de times, personagens, marcas ou celebridades. A licença concedida pelo
          Estampa Flix cobre apenas o <strong>arquivo em si</strong> — o uso comercial de marcas de terceiros é de
          responsabilidade exclusiva do comprador, que deve avaliar caso a caso a legalidade da comercialização em sua
          região e obter, quando necessário, autorização direta dos detentores dos direitos.
        </p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">5. Vigência</h2>
        <p className="mb-4">
          A licença é <strong>vitalícia</strong>: uma vez baixada a arte, o direito de uso permanece válido mesmo que você
          cancele sua assinatura futuramente. O acesso ao arquivo através de "Minha Conta" permanece disponível enquanto a
          conta estiver ativa; recomendamos guardar uma cópia local dos arquivos baixados.
        </p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">6. Comprovação da licença</h2>
        <p className="mb-4">
          O histórico de compras e downloads registrado em sua conta serve como comprovação da licença adquirida. Em caso
          de solicitação por marketplaces ou fiscalização, você pode apresentar o recibo/pedido correspondente disponível
          em <a href="/minha-conta" className="text-primary underline">Minha Conta</a>.
        </p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">7. Violação da licença</h2>
        <p className="mb-4">
          A redistribuição indevida dos arquivos ou o descumprimento das restrições acima implica na <strong>revogação
          imediata</strong> da licença, encerramento da conta sem reembolso e, quando aplicável, as medidas judiciais
          cabíveis nas esferas cível e criminal (Lei nº 9.610/98 — Direitos Autorais).
        </p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">8. Dúvidas</h2>
        <p>
          Ficou com alguma dúvida sobre o que é ou não permitido? Entre em contato pela nossa{" "}
          <a href="/suporte" className="text-primary underline">página de suporte</a> antes de utilizar a arte de forma
          duvidosa — respondemos rapidamente e ajudamos você a operar dentro dos limites da licença.
        </p>
      </>
      </CmsPage>
    </SiteLayout>
  );
}
