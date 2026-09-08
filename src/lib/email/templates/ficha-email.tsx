import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components"

const BRAND_BG = "#0a0a0a"
const BRAND_ACCENT = "#f2a100"

export function FichaEmail({
  clientName,
  vehicleLabel,
}: {
  clientName: string
  vehicleLabel: string
}) {
  return (
    <Html>
      <Head />
      <Preview>Tu ficha de mantención — TC Cars</Preview>
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
          <Text style={{ fontSize: "16px" }}>Hola {clientName},</Text>
          <Text style={{ fontSize: "16px" }}>
            Te adjuntamos la ficha de la mantención de tu {vehicleLabel}. Cualquier duda, escríbenos.
          </Text>
          <Text style={{ fontSize: "12px", color: "#999999", marginTop: "24px" }}>
            TC Cars · Av. Vicuña Mackenna 9320, La Florida, Santiago
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default FichaEmail
