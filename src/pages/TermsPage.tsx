import { Link } from 'react-router-dom'
import LegalLayout from '../components/LegalLayout'
import { LEGAL, val } from '../config/legal'
import { PRODUCT } from '../config/product'

export default function TermsPage() {
  return (
    <LegalLayout title="Términos y condiciones de uso">
      <p>
        Estos términos regulan el uso de {PRODUCT.name} ({PRODUCT.domain}). Al crear una cuenta o usar el servicio, aceptas estos términos y la{' '}
        <Link to="/privacidad">Política de privacidad y cookies</Link>. Si no estás de acuerdo, no uses el servicio.
      </p>

      <h2>1. El servicio</h2>
      <p>
        {PRODUCT.name} ofrece herramientas en línea para trabajar con video, imágenes y audio. Las herramientas procesan tus archivos en tu propio
        dispositivo, dentro del navegador. Por eso el rendimiento depende de tu equipo y del tamaño de tus archivos.
      </p>

      <h2>2. Tu cuenta</h2>
      <ul>
        <li>Debes dar un correo válido y mantener tu contraseña en secreto.</li>
        <li>Eres responsable de lo que ocurra con tu cuenta.</li>
        <li>Debes ser mayor de edad o contar con la autorización de tus representantes.</li>
        <li>Avísanos si crees que alguien accedió a tu cuenta sin permiso.</li>
      </ul>

      <h2>3. Planes y límites</h2>
      <p>
        El plan Gratis tiene límites de uso diario y de tamaño de archivo. {PRODUCT.name} Pro es un plan de pago con otras condiciones. Los límites vigentes
        se muestran en la página de <Link to="/pricing">Precios</Link> y pueden cambiar con aviso razonable. Las condiciones de cobro, renovación, cancelación y
        reembolso están en las <Link to="/suscripcion">Políticas de suscripción</Link>.
      </p>

      <h2>4. Uso aceptable</h2>
      <p>No puedes usar el servicio para:</p>
      <ul>
        <li>Actividades ilegales o que vulneren derechos de terceros, incluidos los derechos de autor.</li>
        <li>Procesar contenido que no tengas derecho a usar.</li>
        <li>Suplantar la identidad de otra persona, por ejemplo con voces sintéticas.</li>
        <li>Saltarte o manipular los límites de uso o de plan.</li>
        <li>Sobrecargar, atacar o intentar acceder sin autorización a nuestros sistemas o a las cuentas de otros usuarios.</li>
      </ul>

      <h2>5. Tu contenido</h2>
      <p>
        Los archivos que procesas son tuyos. Como se procesan en tu dispositivo, no los recibimos ni los almacenamos. Eres responsable de tener los derechos
        necesarios sobre ellos y del uso que hagas de los resultados.
      </p>

      <h2>6. Propiedad intelectual</h2>
      <p>
        El sitio, su diseño, su marca y su código son de su titular o de sus licenciantes. El servicio usa componentes de código abierto y modelos de terceros,
        que tienen sus propias licencias.
      </p>

      <h2>7. Resultados y disponibilidad</h2>
      <p>
        Hacemos lo posible para que las herramientas funcionen bien, pero no garantizamos que estén libres de errores ni disponibles sin interrupciones. Los resultados
        pueden variar según tu dispositivo y tus archivos. Te recomendamos conservar siempre una copia de tus originales.
      </p>

      <h2>8. Suspensión y terminación</h2>
      <p>
        Puedes dejar de usar el servicio y pedir la eliminación de tu cuenta cuando quieras. Podemos suspender o cerrar una cuenta que incumpla estos términos o ponga
        en riesgo el servicio o a otros usuarios.
      </p>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        En la medida permitida por la ley, {PRODUCT.name} no responde por pérdidas indirectas, pérdida de archivos o de ganancias derivadas del uso del servicio.
        Esto no afecta los derechos irrenunciables que la ley te reconoce como consumidor.
      </p>

      <h2>10. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República de Colombia. Cualquier controversia se someterá a los jueces competentes, sin perjuicio de los
        derechos que la ley te otorgue como consumidor.
      </p>

      <h2>11. Cambios en los términos</h2>
      <p>
        Podemos actualizar estos términos. Publicaremos la versión vigente en esta página con su fecha. Si sigues usando el servicio después de un cambio,
        aceptas la nueva versión.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Titular del servicio: {val(LEGAL.owner)}. Correo: {val(LEGAL.email)}.
      </p>
    </LegalLayout>
  )
}