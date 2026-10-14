import LegalLayout from '../components/LegalLayout'
import { LEGAL, val } from '../config/legal'
import { PRODUCT } from '../config/product'

export default function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad y cookies">
      <p>
        Esta política explica qué datos personales trata {PRODUCT.name} ({PRODUCT.domain}), para qué los usa y qué derechos tienes
        sobre ellos. Se rige por la normativa colombiana de protección de datos personales, en particular la Ley 1581 de 2012.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>Nombre o razón social: {val(LEGAL.owner)}</li>
        <li>Documento de identificación o NIT: {val(LEGAL.taxId)}</li>
        <li>Dirección: {val(LEGAL.address)}</li>
        <li>Correo de contacto: {val(LEGAL.email)}</li>
      </ul>

      <h2>2. Datos que tratamos</h2>
      <ul>
        <li><strong>Cuenta:</strong> tu correo electrónico y tu contraseña. La contraseña la gestiona nuestro proveedor de autenticación, que la guarda cifrada; nosotros no la vemos.</li>
        <li><strong>Uso del servicio:</strong> cuántas veces usas cada herramienta por día, para aplicar los límites de tu plan.</li>
        <li><strong>Suscripción:</strong> tu plan, su estado y sus fechas.</li>
        <li><strong>Proyectos del editor:</strong> la estructura de tus proyectos guardados, sin los archivos de video, imagen o audio.</li>
        <li><strong>Datos técnicos:</strong> como la dirección IP y el tipo de navegador, que registran nuestros proveedores de alojamiento por seguridad y funcionamiento.</li>
      </ul>
      <p>
        Cuando se activen los pagos, los procesará un proveedor externo. {PRODUCT.name} no almacena números completos de tarjeta ni códigos de seguridad.
      </p>

      <h2>3. Tus archivos</h2>
      <p>
        Los videos, imágenes y audios que procesas con las herramientas se procesan en tu dispositivo y no se envían a los servidores de {PRODUCT.name}.
        El texto que conviertes en voz tampoco se envía. Algunas herramientas descargan modelos o componentes desde servidores de terceros la primera vez
        que las usas. Esas descargas no incluyen tu contenido, pero el proveedor que las aloja puede ver datos técnicos como tu dirección IP.
      </p>

      <h2>4. Para qué usamos los datos</h2>
      <ul>
        <li>Crear y mantener tu cuenta.</li>
        <li>Prestar el servicio y aplicar los límites de cada plan.</li>
        <li>Mantener la seguridad y prevenir abusos.</li>
        <li>Atender tus solicitudes de soporte.</li>
        <li>Gestionar tu suscripción y tus pagos.</li>
        <li>Cumplir obligaciones legales.</li>
      </ul>

      <h2>5. Cookies y almacenamiento local</h2>
      <p>
        Usamos el almacenamiento del navegador (como localStorage, IndexedDB y la caché) para mantener tu sesión iniciada, recordar preferencias y guardar
        componentes descargados, como los modelos de algunas herramientas, para que no se descarguen cada vez. Son necesarios para que el servicio funcione.
      </p>
      <p>
        A la fecha de actualización no usamos cookies de publicidad ni de análisis de terceros. Si las incorporamos, actualizaremos esta política y pediremos
        tu consentimiento cuando corresponda. Puedes borrar estos datos desde la configuración de tu navegador; si lo haces, tendrás que iniciar sesión de nuevo.
      </p>

      <h2>6. Proveedores que intervienen</h2>
      <ul>
        <li>Supabase: autenticación y base de datos.</li>
        <li>Vercel: alojamiento del sitio.</li>
        <li>Proveedor de pagos ({val(LEGAL.provider)}): cuando se activen los pagos.</li>
      </ul>
      <p>
        Estos proveedores pueden tener servidores fuera de Colombia, por lo que tus datos pueden transferirse internacionalmente. No vendemos tus datos personales.
      </p>

      <h2>7. Cuánto tiempo conservamos los datos</h2>
      <p>
        Conservamos tus datos mientras tengas una cuenta y durante el tiempo necesario para cumplir obligaciones legales. Puedes pedir que eliminemos tu cuenta.
      </p>

      <h2>8. Tus derechos</h2>
      <p>Como titular de los datos puedes:</p>
      <ul>
        <li>Conocer, actualizar y rectificar tus datos personales.</li>
        <li>Solicitar prueba de la autorización que nos diste.</li>
        <li>Ser informado sobre el uso que damos a tus datos.</li>
        <li>Revocar la autorización y solicitar la supresión de tus datos, cuando no exista un deber legal o contractual de conservarlos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
      </ul>
      <p>Para ejercer estos derechos escribe a {val(LEGAL.email)}.</p>

      <h2>9. Menores de edad</h2>
      <p>
        El servicio no está dirigido a menores de edad. Si detectamos una cuenta de un menor sin la autorización de sus representantes, la eliminaremos.
      </p>

      <h2>10. Seguridad</h2>
      <p>
        Aplicamos medidas razonables para proteger tus datos, como conexiones cifradas y control de acceso a la información de cada cuenta. Ningún sistema
        es completamente seguro, por lo que te recomendamos usar una contraseña larga y única.
      </p>

      <h2>11. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política. Publicaremos la versión vigente en esta página con su fecha de actualización.
      </p>
    </LegalLayout>
  )
}