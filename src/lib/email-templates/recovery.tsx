import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { BrandLayout, button, smallMuted, text } from './brand'

interface RecoveryEmailProps {
  siteName?: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <BrandLayout
    preview="Redefina sua senha na Estampa Flix"
    title="Redefinir sua senha"
  >
    <Text style={text}>
      Recebemos um pedido para redefinir a senha da sua conta na{' '}
      <strong>Estampa Flix</strong>. Clique no botão abaixo para escolher uma
      nova senha.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Criar nova senha
    </Button>
    <Text style={smallMuted}>
      O link expira em pouco tempo por segurança. Se você não solicitou a
      redefinição, ignore este e-mail — sua senha atual continua válida.
    </Text>
  </BrandLayout>
)

export default RecoveryEmail
