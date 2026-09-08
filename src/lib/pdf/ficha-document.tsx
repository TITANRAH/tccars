import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"

const BRAND_ORANGE = "#F2A100"
const BRAND_DARK = "#111111"

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    color: BRAND_ORANGE,
  },
  brandSuffix: {
    color: BRAND_DARK,
  },
  contactLine: {
    marginTop: 2,
  },
  tagline: {
    marginTop: 6,
    fontWeight: 700,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: "#333",
    width: 160,
  },
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  infoRowLast: {
    flexDirection: "row",
  },
  infoLabel: {
    width: 90,
    padding: 4,
    fontWeight: 700,
    backgroundColor: "#f2f2f2",
  },
  infoValue: {
    flex: 1,
    padding: 4,
  },
  sectionHeader: {
    backgroundColor: BRAND_DARK,
    color: "#ffffff",
    padding: 4,
    fontWeight: 700,
    marginTop: 12,
  },
  clientRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  clientLabel: {
    fontWeight: 700,
    width: 60,
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: BRAND_ORANGE,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  cellDescription: {
    flex: 1,
    padding: 4,
  },
  cellSmall: {
    width: 60,
    padding: 4,
    textAlign: "right",
    borderLeftWidth: 1,
    borderLeftColor: "#ccc",
  },
  cellHeaderText: {
    fontWeight: 700,
  },
  totalsBlock: {
    marginTop: 0,
    alignSelf: "flex-end",
    width: 220,
  },
  totalsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  totalsLabel: {
    flex: 1,
    padding: 4,
    fontWeight: 700,
    backgroundColor: "#f2f2f2",
  },
  totalsValue: {
    width: 90,
    padding: 4,
    textAlign: "right",
    borderLeftWidth: 1,
    borderLeftColor: "#333",
  },
  nextServiceBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#333",
    padding: 10,
  },
  nextServiceText: {
    fontWeight: 700,
    fontSize: 11,
  },
  footer: {
    marginTop: 24,
    textAlign: "center",
    color: "#666",
    fontSize: 8,
  },
})

const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
})

function clp(value: number) {
  return clpFormatter.format(Math.round(value))
}

const dateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "short" })

export type FichaData = {
  folio: number
  date: Date
  clientName: string
  vehicleLabel: string
  clientPhone: string | null
  description: string
  mileage: number | null
  nextServiceMileage: number | null
  laborCost: number
  partsCost: number
  additionalCost: number
}

export function FichaDocument(data: FichaData) {
  const descriptionLines = data.description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const billableRows = [
    data.laborCost > 0 ? { label: "Mantención", amount: data.laborCost } : null,
    data.additionalCost > 0 ? { label: "Adicional", amount: data.additionalCost } : null,
    data.partsCost > 0 ? { label: "Repuestos", amount: data.partsCost } : null,
  ].filter((row): row is { label: string; amount: number } => row !== null)

  const totalNeto = data.laborCost + data.partsCost + data.additionalCost
  const iva = totalNeto * 0.19
  const totalConIva = totalNeto + iva

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>
              TC<Text style={styles.brandSuffix}> CARS</Text>
            </Text>
            <Text style={styles.contactLine}>Av. Vicuña Mackenna 9320, La Florida, Santiago</Text>
            <Text style={styles.contactLine}>Instagram: tccars.cl</Text>
            <Text style={styles.contactLine}>Teléfono: +569 96970451</Text>
            <Text style={styles.contactLine}>Correo: tccars.cl@gmail.com</Text>
            <Text style={styles.tagline}>Mantención - Scanner - Mecánica automotriz</Text>
          </View>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>FECHA</Text>
              <Text style={styles.infoValue}>{dateFormatter.format(data.date)}</Text>
            </View>
            <View style={styles.infoRowLast}>
              <Text style={styles.infoLabel}>MANTENCIÓN</Text>
              <Text style={styles.infoValue}>{data.folio}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>CLIENTE</Text>
        <View style={styles.clientRow}>
          <Text style={styles.clientLabel}>Nombre:</Text>
          <Text>{data.clientName}</Text>
        </View>
        <View style={styles.clientRow}>
          <Text style={styles.clientLabel}>Vehículo:</Text>
          <Text>{data.vehicleLabel}</Text>
        </View>
        <View style={styles.clientRow}>
          <Text style={styles.clientLabel}>Teléfono:</Text>
          <Text>{data.clientPhone ?? ""}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cellDescription, styles.cellHeaderText]}>DESCRIPCIÓN</Text>
            <Text style={[styles.cellSmall, styles.cellHeaderText]}>PRECIO UNIT.</Text>
            <Text style={[styles.cellSmall, styles.cellHeaderText, { width: 30 }]}>CANT.</Text>
            <Text style={[styles.cellSmall, styles.cellHeaderText, { width: 40 }]}>IVA</Text>
            <Text style={[styles.cellSmall, styles.cellHeaderText]}>TOTAL</Text>
          </View>

          {data.mileage ? (
            <View style={styles.tableRow}>
              <Text style={styles.cellDescription}>Mantención general {data.mileage} km</Text>
              <Text style={styles.cellSmall} />
              <Text style={[styles.cellSmall, { width: 30 }]} />
              <Text style={[styles.cellSmall, { width: 40 }]} />
              <Text style={styles.cellSmall}>$ -</Text>
            </View>
          ) : null}

          {billableRows.map((row) => (
            <View key={row.label} style={styles.tableRow}>
              <Text style={styles.cellDescription}>{row.label}</Text>
              <Text style={styles.cellSmall}>{clp(row.amount)}</Text>
              <Text style={[styles.cellSmall, { width: 30 }]}>1</Text>
              <Text style={[styles.cellSmall, { width: 40 }]}>19%</Text>
              <Text style={styles.cellSmall}>{clp(row.amount * 1.19)}</Text>
            </View>
          ))}

          {descriptionLines.map((line, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.cellDescription}>{line}</Text>
              <Text style={styles.cellSmall} />
              <Text style={[styles.cellSmall, { width: 30 }]} />
              <Text style={[styles.cellSmall, { width: 40 }]} />
              <Text style={styles.cellSmall}>$ -</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={[styles.totalsRow, { borderTopWidth: 0 }]}>
            <Text style={styles.totalsLabel}>Total Neto</Text>
            <Text style={styles.totalsValue}>{clp(totalNeto)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>IVA 19%</Text>
            <Text style={styles.totalsValue}>{clp(iva)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total con IVA</Text>
            <Text style={styles.totalsValue}>{clp(totalConIva)}</Text>
          </View>
        </View>

        {data.nextServiceMileage ? (
          <View style={styles.nextServiceBox}>
            <Text style={styles.nextServiceText}>
              Próxima mantención {data.nextServiceMileage.toLocaleString("es-CL")} km
            </Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          [tccars - Fono +56996970451, tccars.cl@gmail.com]
        </Text>
      </Page>
    </Document>
  )
}
