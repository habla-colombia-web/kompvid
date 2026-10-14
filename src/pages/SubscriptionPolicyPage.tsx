import { Link } from 'react-router-dom'
import LegalLayout from '../components/LegalLayout'
import { LEGAL, val } from '../config/legal'
import { PLANS, PRODUCT } from '../config/product'

const usd = (n: number) => 'US$' + n.toFixed(2)

export default function SubscriptionPolicyPage() {
  const proMB = PLANS.pro.maxFileMB ?? PLANS.free.maxFileMB
  return (
    <LegalLayout title="Políticas de suscripción">
      <p>
        Estas políticas explican cómo funciona el plan de pago de {PRODUCT.name}. Se aplican junto con los <Link to="/terminos">Términos y condiciones de uso</Link>.
      </p>

      {!LEGAL.paymentsActive && (
        <p className="lg-draft" role="note">
          Los pagos todavía no están activos y {PLANS.pro.name} aún no puede contratarse. Estas políticas regirán desde que se active el cobro.
        </p>
      )}

      <h2>1. Planes y precios</h2>
      <ul>
        <li>
          <strong>{PLANS.free.name}:</strong> {usd(0)}. Hasta {PLANS.free.maxFileMB} MB por archivo y {PLANS.free.dailyOperations} usos al día por herramienta.
        </li>
        <li>
          <strong>{PLANS.pro.name}:</strong> {usd(PLANS.pro.priceMonthly)} al mes o {usd(PLANS.pro.priceYearly)} al año. Sin límite diario de usos, hasta {proMB} MB
          por archivo y herramientas exclusivas.
        </li>
      </ul>
      <p>
        Los precios están en dólares estadounidenses (USD). Los precios y las características vigentes se muestran siempre en la página de <Link to="/pricing">Precios</Link>.
      </p>

      <h2>2. Cobro y renovación</h2>
      <p>
        {PLANS.pro.name} es una suscripción que se renueva automáticamente cada mes o cada año, según el periodo que elijas, hasta que la canceles.
        El cobro lo procesa un proveedor de pagos externo ({val(LEGAL.provider)}).
      </p>

      <h2>3. Cómo se activa el plan</h2>
      <p>
        El acceso Pro se activa solo cuando el proveedor de pagos confirma el pago. Volver a nuestra página después de pagar no activa el plan por sí solo, y la
        confirmación puede tardar unos minutos.
      </p>

      <h2>4. Impuestos y cargos</h2>
      <p>
        Según tu país pueden aplicarse impuestos u otros cargos. El detalle se muestra antes de confirmar el pago.
      </p>

      <h2>5. Cancelación</h2>
      <p>
        Puedes cancelar cuando quieras desde tu cuenta. Al cancelar no se harán nuevos cobros y conservas el acceso Pro hasta el final del periodo ya pagado.
        Después tu cuenta pasa al plan Gratis.
      </p>

      <h2>6. Reembolsos</h2>
      {LEGAL.refundPolicy
        ? <p>{LEGAL.refundPolicy}</p>
        : <p>La política de reembolsos se publicará aquí antes de activar los pagos.</p>}

      <h2>7. Pagos fallidos</h2>
      <p>
        Si un cobro falla, tu suscripción pasa a estado de pago vencido y podemos suspender el acceso Pro hasta que se regularice. Un pago fallido no da acceso
        Pro permanente.
      </p>

      <h2>8. Cambios de precio y de servicio</h2>
      <p>
        Podemos cambiar los precios o las herramientas incluidas en cada plan. Te avisaremos con anticipación razonable y los cambios de precio se aplicarán a partir
        de la siguiente renovación.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Para dudas sobre tu suscripción escribe a {val(LEGAL.email)}.
      </p>
    </LegalLayout>
  )
}