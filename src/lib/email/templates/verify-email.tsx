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

export function VerifyEmail({ name, verifyUrl }: { name: string; verifyUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>Confirma tu cuenta en TC Cars</Preview>
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
          <Text style={{ fontSize: "16px" }}>Hola {name},</Text>
          <Text style={{ fontSize: "16px" }}>
            Gracias por crear tu cuenta. Confirma tu correo para poder ingresar al sistema y
            revisar el historial de tus vehículos.
          </Text>
          <Button
            href={verifyUrl}
            style={{
              backgroundColor: BRAND_ACCENT,
              color: "#0a0a0a",
              padding: "12px 20px",
              borderRadius: "8px",
              fontWeight: "bold",
              textDecoration: "none",
            }}
          >
            Confirmar mi cuenta
          </Button>
          <Text style={{ fontSize: "12px", color: "#999999", marginTop: "24px" }}>
            Si no creaste esta cuenta, puedes ignorar este correo.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default VerifyEmail
