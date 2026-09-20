import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { BrandLayout, button, smallMuted, text } from './brand'

interface EmailChangeEmailProps {
  siteName?: string
  oldEmail?: string
  email?: string
  newEmail?: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <BrandLayout
    preview="Confirme seu novo e-mail na Estampa Flix"
    title="Confirme seu novo e-mail"
  >
    <Text style={text}>
      Recebemos um pedido para alterar o e-mail da sua conta na{' '}
      <strong>Estampa Flix</strong>
      {oldEmail && newEmail ? ` de ${oldEmail} para ${newEmail}` : ''}. Confirme
      a alteração no botão abaixo.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Confirmar novo e-mail
    </Button>
    <Text style={smallMuted}>
      Se você não solicitou esta alteração, ignore este e-mail — nada será
      alterado.
    </Text>
  </BrandLayout>
)

export default EmailChangeEmail
