import { NextRequest } from "next/server"

/**
 * Todas las rutas /api/n8n/* se autentican con un API key compartido,
 * enviado por n8n en el header `x-api-key`. No hay sesión de usuario en
 * estas llamadas: es n8n hablando directamente con la app.
 */
export function isValidN8nRequest(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key")
  const expected = process.env.N8N_API_KEY
  return !!expected && apiKey === expected
}
