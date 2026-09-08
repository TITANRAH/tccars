import { renderToBuffer } from "@react-pdf/renderer"
import { FichaDocument, type FichaData } from "@/lib/pdf/ficha-document"

export async function renderFichaPdf(data: FichaData) {
  return renderToBuffer(FichaDocument(data))
}
