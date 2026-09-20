import * as React from 'react'
import { Button, Text } from '@react-email/components'
import { BrandLayout, button, smallMuted, text } from './brand'

interface SignupEmailProps {
  siteName?: string
  siteUrl?: string
  recipient?: string
  confirmationUrl: string
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <BrandLayout
    preview="Confirme seu e-mail na Estampa Flix"
    title="Confirme seu e-mail"
  >
    <Text style={text}>
      Bem-vindo à <strong>Estampa Flix</strong>! Falta só um passo para ativar
      sua conta{recipient ? ` (${recipient})` : ''} e começar a baixar suas
      artes.
    </Text>
    <Button style={button} href={confirmationUrl}>
      Confirmar meu e-mail
    </Button>
    <Text style={smallMuted}>
      Se você não criou uma conta na Estampa Flix, pode ignorar este e-mail com
      segurança.
    </Text>
  </BrandLayout>
)

export default SignupEmail
