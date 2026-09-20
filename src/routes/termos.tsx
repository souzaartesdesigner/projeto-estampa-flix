import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { CmsPage } from "@/components/cms-page";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Estampa Flix" },
      { name: "description", content: "Termos e condições de uso do Estampa Flix: licença de uso, assinaturas, compras avulsas e responsabilidades." },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Termos de Uso — Estampa Flix" },
      { property: "og:description", content: "Termos e condições para uso das artes digitais do Estampa Flix." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://estampaflix.com/termos" },
      { name: "keywords", content: "termos de uso, condições de uso estampa flix" },
    ],
    links: [{ rel: "canonical", href: "https://estampaflix.com/termos" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SiteLayout>
      <CmsPage contentKey="page_termos" defaultTitle="Termos de Uso">
        <>

        <p className="mb-6">
          Ao criar uma conta ou realizar uma compra no Estampa Flix, você concorda integralmente com estes Termos de Uso.
          Leia com atenção antes de utilizar o serviço.
        </p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">1. Sobre o serviço</h2>
        <p className="mb-4">O Estampa Flix é um marketplace de artes digitais em alta resolução para sublimação, DTF, camisetas e outros produtos personalizados. Oferecemos: (a) assinaturas mensais com créditos para downloads; (b) compras avulsas via Pix.</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">2. Cadastro</h2>
        <p className="mb-4">Você deve ter 18 anos ou mais e fornecer informações verdadeiras. Você é responsável pela segurança da sua senha e por todas as atividades realizadas na sua conta.</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">3. Licença de uso das artes</h2>
        <p className="mb-4">Ao baixar uma arte (via créditos de assinatura ou compra avulsa), concedemos a você uma licença <strong>não-exclusiva, mundial, comercial e vitalícia</strong> para:</p>
        <ul className="mb-4 list-disc space-y-1 pl-6">
          <li>Utilizar as artes em produtos físicos que você produz e vende (canecas, camisetas, quadros, adesivos etc.).</li>
          <li>Modificar, editar e adaptar as artes conforme sua necessidade.</li>
        </ul>
        <p className="mb-4"><strong>É proibido:</strong></p>
        <ul className="mb-4 list-disc space-y-1 pl-6">
          <li>Revender, redistribuir ou compartilhar os arquivos originais.</li>
          <li>Fazer upload das artes em bancos de imagens, marketplaces de arquivos digitais ou plataformas concorrentes.</li>
          <li>Utilizar as artes em conteúdo ilegal, ofensivo, difamatório ou que viole direitos de terceiros.</li>
          <li>Reivindicar autoria original das artes.</li>
        </ul>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">4. Assinaturas</h2>
        <ul className="mb-4 list-disc space-y-1 pl-6">
          <li>As assinaturas são cobradas mensalmente e renovadas automaticamente até o cancelamento.</li>
          <li>Créditos não utilizados <strong>não acumulam</strong> para o mês seguinte e são resetados a cada renovação.</li>
          <li>O cancelamento pode ser feito a qualquer momento em "Minha Conta". O acesso permanece ativo até o fim do período pago.</li>
        </ul>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">5. Compras avulsas</h2>
        <p className="mb-4">Pagamentos via Pix são processados pelo Mercado Pago. A arte fica disponível para download imediatamente após a confirmação do pagamento. Downloads permanecem acessíveis em "Minha Conta" enquanto a conta estiver ativa.</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">6. Reembolsos</h2>
        <p className="mb-4">Devido à natureza digital do produto (entrega instantânea de arquivo), <strong>não oferecemos reembolso</strong> após o download da arte. Assinaturas podem ser canceladas a qualquer momento, mas não há reembolso proporcional do período em andamento. Casos excepcionais serão avaliados individualmente pelo suporte.</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">7. Propriedade intelectual</h2>
        <p className="mb-4">Todas as artes disponibilizadas são de propriedade do Estampa Flix ou licenciadas de forma legítima. Marcas, logos e nomes de terceiros eventualmente representados são de responsabilidade do comprador quanto ao uso comercial adequado.</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">8. Suspensão e encerramento</h2>
        <p className="mb-4">Podemos suspender ou encerrar contas que violem estes Termos, incluindo (mas não limitado a) redistribuição indevida de arquivos, fraudes em pagamentos ou uso abusivo do serviço, sem direito a reembolso.</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">9. Limitação de responsabilidade</h2>
        <p className="mb-4">O Estampa Flix não se responsabiliza por resultados comerciais obtidos pelo usuário com as artes, nem por indisponibilidades pontuais decorrentes de manutenção ou fatores externos (provedores de pagamento, infraestrutura de terceiros).</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">10. Alterações</h2>
        <p className="mb-4">Podemos atualizar estes Termos a qualquer momento. Alterações relevantes serão comunicadas por e-mail. O uso contínuo do serviço após a alteração constitui aceitação dos novos termos.</p>

        <h2 className="mb-2 mt-8 font-display text-xl font-semibold text-foreground">11. Lei aplicável e foro</h2>
        <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do consumidor para dirimir eventuais controvérsias.</p>
      </>
      </CmsPage>
    </SiteLayout>
  );
}
