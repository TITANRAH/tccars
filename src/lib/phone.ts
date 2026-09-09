/**
 * Deja solo dígitos — WhatsApp manda el número del remitente sin "+", sin
 * espacios ni guiones (ej. "56912345678"). Si un teléfono se guarda con
 * cualquiera de esos símbolos (lo más natural al tipearlo a mano), nunca
 * volvería a coincidir con lo que llega por WhatsApp, y el control de acceso
 * por rol trataría a un colaborador o cliente real como anónimo.
 */
export function normalizePhone(value: string) {
  return value.replace(/\D/g, "")
}
