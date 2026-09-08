import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components"

const BRAND_BG = "#0a0a0a"
const BRAND_ACCENT = "#f2a100"

export function ResetPasswordEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>Recupera el acceso a tu cuenta de TC Cars</Preview>
      <Body style={{ backgroundColor: "#111111", fontFamily: "Arial, sans-serif" }}>
        <Container
          style={{
            backgroundColor: BRAND_BG,
            padding: "32px",
            borderRadius: "12px",
            color: "#ffffff",
            maxWidth: "480px",
          }}
        >
          <Heading style={{ color: BRAND_ACCENT, fontSize: "22px" }}>TC CARS</Heading>
          <Text style={{ fontSize: "16px" }}>
            Recibimos una solicitud para restablecer tu contraseña. Este enlace vence en 30
            minutos.
          </Text>
          <Button
            href={resetUrl}
            style={{
              backgroundColor: BRAND_ACCENT,
              color: "#0a0a0a",
              padding: "12px 20px",
              borderRadius: "8px",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Restablecer contraseña
          </Button>
          <Text style={{ fontSize: "12px", color: "#999999", marginTop: "24px" }}>
            Si no solicitaste este cambio, puedes ignorar este correo.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ResetPasswordEmail
