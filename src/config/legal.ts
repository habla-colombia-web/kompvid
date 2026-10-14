// Datos legales. Completa los vacios antes de publicar y pon reviewed en true
// solo cuando un abogado haya revisado las tres paginas.
export const LEGAL = {
  reviewed: false,
  updated: '14 de octubre de 2026',
  owner: '', // nombre completo o razon social
  taxId: '', // cedula o NIT
  address: '',
  email: '', // correo de contacto legal y de soporte
  provider: '', // proveedor de pagos, cuando se elija
  paymentsActive: false,
  refundPolicy: '', // ej.: 'Puedes pedir un reembolso dentro de los 14 dias siguientes al primer cobro.'
}

export const val = (s: string) => s.trim() || '[por completar]'