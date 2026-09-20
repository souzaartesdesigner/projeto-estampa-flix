import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { BrandLayout, button, smallMuted, text } from './brand'

interface MagicLinkEmailProps {
  siteName?: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <BrandLayout
    preview="Seu link de acesso à Estampa Flix"
    title="Seu link de acesso"
  >
    <Text style={text}>
      Clique no botão abaixo para entrar na sua conta da{' '}
      <strong>Estampa Flix</strong>. Este link é pessoal e expira em breve.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Entrar na minha conta
    </Button>
    <Text style={smallMuted}>
      Se você não pediu este link, pode ignorar este e-mail com segurança.
    </Text>
  </BrandLayout>
)

export default MagicLinkEmail
