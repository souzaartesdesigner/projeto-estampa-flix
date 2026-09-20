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

interface OrderItem {
  title?: string;
  price_cents?: number;
}

interface Props {
  customerName?: string;
  orderNumber?: string;
  items?: OrderItem[];
  totalCents?: number;
  discountCents?: number;
  paymentUrl?: string;
  expiresAt?: string;
}

const brl = (cents?: number) =>
  ((cents ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Email = ({
  customerName,
  orderNumber = "—",
  items = [],
  totalCents = 0,
  discountCents = 0,
  paymentUrl,
  expiresAt,
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu pedido {orderNumber} foi criado — falta só o pagamento via Pix</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>Estampa Flix</Text>

        <Heading style={h1}>Pedido criado com sucesso</Heading>
        <Text style={text}>
          {customerName ? `Olá, ${customerName}!` : "Olá!"} Recebemos seu pedido{" "}
          <strong>{orderNumber}</strong>. Ele ficará reservado até a confirmação do pagamento via
          Pix.
        </Text>

        <Section style={card}>
          {items.map((item, i) => (
            <Text key={i} style={itemRow}>
              {item.title ?? "Arte digital"}
              <span style={itemPrice}>{brl(item.price_cents)}</span>
            </Text>
          ))}
          <Hr style={hr} />
          {discountCents > 0 && (
            <Text style={itemRow}>
              Desconto<span style={itemPrice}>-{brl(discountCents)}</span>
            </Text>
          )}
          <Text style={totalRow}>
            Total<span style={totalPrice}>{brl(totalCents)}</span>
          </Text>
        </Section>

        {paymentUrl && (
          <Section style={{ textAlign: "center", margin: "28px 0" }}>
            <Link href={paymentUrl} style={button}>
              Pagar com Pix
            </Link>
          </Section>
        )}

        {expiresAt && (
          <Text style={muted}>
            O código Pix expira em {expiresAt}. Após esse prazo será necessário refazer o pedido.
          </Text>
        )}

        <Hr style={hr} />
        <Text style={muted}>
          Assim que o pagamento for aprovado, enviamos outro e-mail com os links de download das
          suas artes.
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
const h1 = { fontSize: "22px", color: "#131313", margin: "0 0 12px" };
const text = { fontSize: "15px", lineHeight: "24px", color: "#333333", margin: "0 0 16px" };
const card = {
  backgroundColor: "#f5f7fa",
  borderRadius: "10px",
  padding: "16px 18px",
  margin: "20px 0",
};
const itemRow = {
  fontSize: "14px",
  color: "#333333",
  margin: "0 0 8px",
  display: "block" as const,
};
const itemPrice = { float: "right" as const, color: "#131313", fontWeight: 600 };
const totalRow = { fontSize: "15px", color: "#131313", margin: "8px 0 0", fontWeight: 700 };
const totalPrice = { float: "right" as const, color: "#007bff" };
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
    `Pedido ${data?.orderNumber ?? ""} criado — aguardando pagamento Pix`.replace("  ", " "),
  displayName: "Confirmação de pedido",
  previewData: {
    customerName: "Maria",
    orderNumber: "#A1B2C3D4",
    items: [
      { title: "Estampa Seleção Brasileira", price_cents: 990 },
      { title: "Kit Formandos 2026", price_cents: 1490 },
    ],
    totalCents: 2180,
    discountCents: 300,
    paymentUrl: "https://estampaflix.com/pagamento/pix/exemplo",
    expiresAt: "30 minutos",
  },
} satisfies TemplateEntry;
