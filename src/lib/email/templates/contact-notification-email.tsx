import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components"

const BRAND_BG = "#0a0a0a"
const BRAND_ACCENT = "#f2a100"

export function ContactNotificationEmail({
  name,
  email,
  phone,
  message,
}: {
  name: string
  email: string
  phone?: string | null
  message: string
}) {
  return (
    <Html>
      <Head />
      <Preview>Nuevo mensaje de contacto — {name}</Preview>
      <Body style={{ backgroundColor: "#111111", fontFamily: "Arial, sans-serif" }}>
        <Container
          style={{
            backgroundColor: BRAND_BG,
            padding: "32px",
            borderRadius: "12px",
            color: "#ffffff",
            maxWidth: "520px",
          }}
        >
          <Heading style={{ color: BRAND_ACCENT, fontSize: "20px" }}>
            Nuevo mensaje de contacto
          </Heading>
          <Text style={{ fontSize: "15px" }}>
            <strong>Nombre:</strong> {name}
          </Text>
          <Text style={{ fontSize: "15px" }}>
            <strong>Email:</strong> {email}
          </Text>
          {phone ? (
            <Text style={{ fontSize: "15px" }}>
              <strong>Teléfono:</strong> {phone}
            </Text>
          ) : null}
          <Text style={{ fontSize: "15px", whiteSpace: "pre-wrap" }}>
            <strong>Mensaje:</strong>
            {"\n"}
            {message}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ContactNotificationEmail
