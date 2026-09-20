import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export const SITE_URL = 'https://estampaflix.com'
export const LOGO_URL = 'https://estampaflix.com/favicon.png'

export const colors = {
  primary: '#007bff',
  dark: '#071b30',
  text: '#3d4653',
  muted: '#8a93a1',
  border: '#e6eaf0',
  surface: '#f6f8fb',
}

export const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  margin: '0',
  padding: '0',
}

export const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 24px 40px',
}

export const card = {
  border: `1px solid ${colors.border}`,
  borderRadius: '16px',
  padding: '32px 28px',
  backgroundColor: '#ffffff',
}

export const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: colors.dark,
  margin: '0 0 16px',
}

export const text = {
  fontSize: '15px',
  color: colors.text,
  lineHeight: '1.6',
  margin: '0 0 18px',
}

export const button = {
  display: 'inline-block',
  backgroundColor: colors.primary,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '10px',
  padding: '14px 26px',
  textDecoration: 'none',
}

export const smallMuted = {
  fontSize: '12px',
  color: colors.muted,
  lineHeight: '1.6',
  margin: '18px 0 0',
}

export const codeBox = {
  backgroundColor: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: '12px',
  padding: '18px',
  textAlign: 'center' as const,
  fontSize: '30px',
  letterSpacing: '8px',
  fontWeight: 'bold' as const,
  color: colors.dark,
  margin: '0 0 18px',
}

export const link = { color: colors.primary, textDecoration: 'underline' }

interface LayoutProps {
  preview: string
  title: string
  children: React.ReactNode
}

/** Shared branded shell for all Estampa Flix authentication emails. */
export const BrandLayout = ({ preview, title, children }: LayoutProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={{ textAlign: 'center', margin: '0 0 24px' }}>
          <Link href={SITE_URL}>
            <Img
              src={LOGO_URL}
              width="48"
              height="48"
              alt="Estampa Flix"
              style={{ display: 'inline-block', borderRadius: '12px' }}
            />
          </Link>
          <Text
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: colors.dark,
              margin: '10px 0 0',
            }}
          >
            Estampa Flix
          </Text>
        </Section>

        <Section style={card}>
          <Heading style={h1}>{title}</Heading>
          {children}
        </Section>

        <Hr style={{ borderColor: colors.border, margin: '28px 0 16px' }} />
        <Text style={{ ...smallMuted, textAlign: 'center' as const, margin: '0' }}>
          Estampa Flix — artes digitais para sublimação
          <br />
          <Link href={SITE_URL} style={link}>
            estampaflix.com
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)
