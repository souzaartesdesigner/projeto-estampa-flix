import * as React from 'react'
import { Text } from '@react-email/components'
import { BrandLayout, codeBox, smallMuted, text } from './brand'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <BrandLayout
    preview="Seu código de verificação da Estampa Flix"
    title="Seu código de verificação"
  >
    <Text style={text}>
      Use o código abaixo para confirmar sua identidade na{' '}
      <strong>Estampa Flix</strong>:
    </Text>
    <Text style={codeBox}>{token}</Text>
    <Text style={smallMuted}>
      O código expira em poucos minutos. Se você não solicitou, ignore este
      e-mail.
    </Text>
  </BrandLayout>
)

export default ReauthenticationEmail
