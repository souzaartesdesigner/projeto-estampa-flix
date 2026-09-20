import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface DownloadItem {
  title?: string;
  url?: string;
}

interface Props {
  customerName?: string;
  orderNumber?: string;
  totalCents?: number;
  items?: DownloadItem[];
  accountUrl?: string;
}

const brl = (cents?: number) =>
  ((cents ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Email = ({
  customerName,
  orderNumber = "—",
  totalCents = 0,
  items = [],
  accountUrl = "https://estampaflix.com/minha-conta",
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Pagamento aprovado — suas artes já estão liberadas para download</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Estampa Flix</Text>

        <Section style={badge}>Pagamento aprovado</Section>

        <Heading style={h1}>Suas artes estão liberadas</Heading>
        <Text style={text}>
          {customerName ? `Olá, ${customerName}!` : "Olá!"} Confirmamos o pagamento do pedido{" "}
          <strong>{orderNumber}</strong> no valor de <strong>{brl(totalCents)}</strong>. O download
          já está disponível na sua conta.
        </Text>

        <Section style={card}>
          {items.map((item, i) => (
            <Text key={i} style={itemRow}>
              {item.url ? (
                <Link href={item.url} style={itemLink}>
                  {item.title ?? "Arte digital"}
                </Link>
              ) : (
                (item.title ?? "Arte digital")
              )}
            </Text>
          ))}
        </Section>

        <Section style={{ textAlign: "center", margin: "28px 0" }}>
          <Link href={accountUrl} style={button}>
            Fazer download das artes
          </Link>
        </Section>

        <Text style={muted}>
          Os downloads ficam disponíveis permanentemente na área “Minha conta”. Basta entrar com o
          mesmo e-mail deste pedido.
        </Text>

        <Hr style={hr} />
        <Text style={muted}>
          Todas as artes incluem licença comercial vitalícia conforme os termos de uso.
        </Text>
        <Text style={footer}>Estampa Flix — artes digitais para sublimação e DTF</Text>
      </Container>
    </Body>
  </Html>
);

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif" };
const container = { padding: "28px 24px", maxWidth: "560px", margin: "0 auto" };
const brand = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#007bff",
  letterSpacing: "0.5px",
  margin: "0 0 20px",
};
const badge = {
  display: "inline-block",
  backgroundColor: "#e6f7ee",
  color: "#0f7a44",
  borderRadius: "999px",
  padding: "6px 14px",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "12px",
};
const h1 = { fontSize: "22px", color: "#131313", margin: "0 0 12px" };
const text = { fontSize: "15px", lineHeight: "24px", color: "#333333", margin: "0 0 16px" };
const card = {
  backgroundColor: "#f5f7fa",
  borderRadius: "10px",
  padding: "16px 18px",
  margin: "20px 0",
};
const itemRow = { fontSize: "14px", color: "#333333", margin: "0 0 8px" };
const itemLink = { color: "#007bff", textDecoration: "none", fontWeight: 600 };
const button = {
  backgroundColor: "#007bff",
  color: "#ffffff",
  padding: "13px 30px",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
};
const hr = { borderColor: "#e3e8ee", margin: "18px 0" };
const muted = { fontSize: "13px", lineHeight: "20px", color: "#6b7280", margin: "0 0 10px" };
const footer = { fontSize: "12px", color: "#9ca3af", marginTop: "18px" };

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Pagamento aprovado — pedido ${data?.orderNumber ?? ""} liberado para download`,
  displayName: "Pagamento aprovado",
  previewData: {
    customerName: "Maria",
    orderNumber: "#A1B2C3D4",
    totalCents: 2180,
    items: [
      { title: "Estampa Seleção Brasileira", url: "https://estampaflix.com/artes/selecao" },
      { title: "Kit Formandos 2026", url: "https://estampaflix.com/artes/formandos" },
    ],
    accountUrl: "https://estampaflix.com/minha-conta",
  },
} satisfies TemplateEntry;
