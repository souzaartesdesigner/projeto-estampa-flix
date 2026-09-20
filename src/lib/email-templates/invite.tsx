import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { BrandLayout, button, smallMuted, text } from './brand'

interface InviteEmailProps {
  siteName?: string
  siteUrl?: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <BrandLayout
    preview="Você foi convidado para a Estampa Flix"
    title="Você foi convidado"
  >
    <Text style={text}>
      Você recebeu um convite para participar da <strong>Estampa Flix</strong>,
      a plataforma de artes digitais para sublimação. Aceite o convite para
      criar sua conta.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Aceitar convite
    </Button>
    <Text style={smallMuted}>
      Se você não esperava este convite, pode ignorar este e-mail.
    </Text>
  </BrandLayout>
)

export default InviteEmail
