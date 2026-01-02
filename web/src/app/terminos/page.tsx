import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones - ofiSí",
  description: "Términos y Condiciones de Uso de ofiSí",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← Volver al inicio
          </Link>
        </div>

        <article className="prose prose-lg max-w-none text-gray-900">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">
            TÉRMINOS Y CONDICIONES DE USO
          </h1>
          <h2 className="text-2xl text-gray-600 mb-8">
            ofiSi - Plataforma de Servicios u Oficios
          </h2>

          <p className="text-sm text-gray-500 mb-8">
            <strong className="text-gray-700">Última actualización:</strong>{" "}
            01/01/2026
          </p>

          <hr className="my-8" />

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              1. ACEPTACIÓN DE LOS TÉRMINOS
            </h2>
            <p className="text-gray-700">
              Al descargar, instalar, acceder o utilizar la aplicación móvil
              "ofiSí" (en adelante, la "Aplicación" o el "Servicio"), usted (en
              adelante, el "Usuario") acepta estar legalmente vinculado por
              estos Términos y Condiciones de Uso (en adelante, los "Términos").
              Si no está de acuerdo con estos Términos, no debe utilizar la
              Aplicación.
            </p>
            <p className="text-gray-700">
              Estos Términos constituyen un acuerdo legalmente vinculante entre
              usted y OyD SRL (en adelante, "nosotros", "nuestro" o la
              "Compañía"). Al utilizar la Aplicación, usted reconoce que ha
              leído, entendido y acepta cumplir con estos Términos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              2. DESCRIPCIÓN DEL SERVICIO
            </h2>
            <p className="text-gray-700">
              ofiSí es una plataforma digital que conecta a clientes que
              requieren servicios u oficios con técnicos y prestadores de
              servicios calificados. La Aplicación permite:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Registro de usuarios como clientes o prestadores de servicios u
                oficios.
              </li>
              <li>
                Búsqueda y selección de prestadores de servicios u oficios.
              </li>
              <li>Creación y gestión de solicitudes de servicios u oficios.</li>
              <li>Sistema de cotizaciones y presupuestos.</li>
              <li>
                Comunicación entre clientes y prestadores de servicios u
                oficios.
              </li>
              <li>Sistema de calificaciones y reseñas.</li>
              <li>Gestión de trabajos y pagos.</li>
              <li>
                Visualización de portfolios y certificaciones de prestadores de
                servicios u oficios.
              </li>
            </ul>
            <p className="text-gray-700">
              La Aplicación actúa únicamente como intermediario entre clientes y
              prestadores de servicios. No somos responsables por la calidad,
              seguridad, legalidad o cumplimiento de los servicios prestados por
              los prestadores de servicios u oficios registrados en la
              plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              3. REGISTRO Y CUENTA DE USUARIO
            </h2>

            <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              3.1. Requisitos de Registro
            </h3>
            <p className="text-gray-700">Para utilizar la Aplicación, debe:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Ser mayor de edad según la legislación aplicable en su
                jurisdicción.
              </li>
              <li>
                Proporcionar información precisa, actual y completa durante el
                registro.
              </li>
              <li>
                Mantener y actualizar su información de cuenta para mantenerla
                precisa.
              </li>
              <li>Mantener la seguridad de su cuenta y contraseña.</li>
              <li>
                Notificarnos inmediatamente de cualquier uso no autorizado de su
                cuenta.
              </li>
              <li>
                Aceptar la responsabilidad por todas las actividades que ocurran
                bajo su cuenta.
              </li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              3.2. Tipos de Usuario
            </h3>
            <p className="text-gray-700">
              La Aplicación permite dos tipos de usuarios:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong className="text-gray-900">Clientes</strong>: Personas
                que buscan contratar servicios u oficios.
              </li>
              <li>
                <strong className="text-gray-900">Prestadores/Técnicos</strong>:
                Prestadores de servicios u oficios que ofrecen servicios a
                través de la plataforma.
              </li>
            </ul>
            <p className="text-gray-700">
              Un usuario puede registrarse como ambos tipos si cumple con los
              requisitos correspondientes.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              3.3. Verificación de Identidad
            </h3>
            <p className="text-gray-700">
              Nos reservamos el derecho de verificar la identidad de los
              usuarios, especialmente de los prestadores de servicios, mediante
              documentos de identidad, certificaciones profesionales u otros
              medios que consideremos apropiados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              4. PERMISOS Y ACCESO A DISPOSITIVOS
            </h2>

            <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              4.1. Permisos de Cámara
            </h3>
            <p className="text-gray-700">
              La Aplicación solicita acceso a la cámara de su dispositivo para
              las siguientes finalidades:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong className="text-gray-900">Fotos de perfil</strong>:
                Permitir a los usuarios tomar o seleccionar fotografías para su
                perfil de usuario.
              </li>
              <li>
                <strong className="text-gray-900">
                  Portfolios de trabajos.
                </strong>
                : Permitir a los prestadores de servicios tomar fotografías de
                trabajos realizados para incluirlos en su portfolio.
              </li>
              <li>
                <strong className="text-gray-900">
                  Documentación de servicios.
                </strong>
                : Permitir a los usuarios tomar fotografías relacionadas con
                solicitudes de servicios o trabajos en progreso.
              </li>
            </ul>

            <p className="mt-4 text-gray-700">
              <strong className="text-gray-900">Uso de las imágenes:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Las imágenes capturadas se almacenan de forma segura en nuestros
                servidores.
              </li>
              <li>
                Las fotos de perfil son visibles para otros usuarios de la
                plataforma.
              </li>
              <li>
                Los portfolios de trabajos son visibles públicamente en los
                perfiles de prestadores.
              </li>
              <li>
                No utilizamos las imágenes para fines distintos a los
                especificados en estos Términos.
              </li>
              <li>
                No compartimos las imágenes con terceros sin su consentimiento
                explícito, excepto cuando sea necesario para el funcionamiento
                del servicio..
              </li>
            </ul>

            <p className="mt-4 text-gray-700">
              <strong className="text-gray-900">Control del Usuario:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Puede revocar el permiso de cámara en cualquier momento desde la
                configuración de su dispositivo
              </li>
              <li>
                Puede eliminar sus fotos de perfil o imágenes de portfolio en
                cualquier momento desde la Aplicación.
              </li>
              <li>
                Si revoca el permiso de cámara, algunas funcionalidades de la
                Aplicación pueden no estar disponibles.
              </li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt.-6 text-gray-800">
              4.2. Permisos de Geolocalización.
            </h3>
            <p className="text-gray-700">
              La Aplicación solicita acceso a la ubicación de su dispositivo
              para las siguientes finalidades:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong className="text-gray-900">
                  Registro de prestadores.
                </strong>
                : Obtener la ubicación de los prestadores de servicios para
                determinar su zona de cobertura.
              </li>
              <li>
                <strong className="text-gray-900">
                  Búsqueda de servicios cercanos.
                </strong>
                : Permitir a los clientes encontrar prestadores de servicios en
                su área geográfica.
              </li>
              <li>
                <strong className="text-gray-900">
                  Coincidencias de ubicación.
                </strong>
                : Conectar clientes con prestadores cercanos para facilitar la
                prestación de servicios.
              </li>
              <li>
                <strong className="text-gray-900">
                  Mejora de la experiencia.
                </strong>
                : Proporcionar funcionalidades basadas en ubicación, como mapas
                y direcciones.
              </li>
            </ul>

            <p className="mt-4 text-gray-700">
              <strong className="text-gray-900">Uso de la ubicación:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                La ubicación se utiliza únicamente cuando la Aplicación está en
                uso activo (foreground).
              </li>
              <li>
                No rastreamos su ubicación en segundo plano sin su
                consentimiento explícito.
              </li>
              <li>
                La ubicación se almacena de forma segura y se utiliza únicamente
                para los fines especificados.
              </li>
              <li>
                Compartimos información de ubicación aproximada (no precisa) con
                otros usuarios cuando es necesario para el funcionamiento del
                servicio.
              </li>
              <li>
                No vendemos ni compartimos datos de ubicación precisos con
                terceros para fines de marketing o publicidad.
              </li>
            </ul>

            <p className="mt-4 text-gray-700">
              <strong className="text-gray-900">Control del Usuario:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Puede revocar el permiso de ubicación en cualquier momento desde
                la configuración de su dispositivo.
              </li>
              <li>
                Puede ajustar la precisión de la ubicación compartida en la
                configuración de la Aplicación.
              </li>
              <li>
                Si revoca el permiso de ubicación, algunas funcionalidades de la
                Aplicación pueden no estar disponibles.
              </li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              4.3. Otros Permisos
            </h3>
            <p className="text-gray-700">
              La Aplicación puede solicitar otros permisos necesarios para su
              funcionamiento, como:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong className="text-gray-900">Almacenamiento</strong>: Para
                guardar imágenes y archivos relacionados con el servicio.
              </li>
              <li>
                <strong className="text-gray-900">Notificaciones</strong>: Para
                enviar notificaciones sobre solicitudes, mensajes y
                actualizaciones del servicio.
              </li>
            </ul>
            <p className="text-gray-700">
              Todos los permisos se solicitan de forma explícita y el usuario
              puede revocarlos en cualquier momento desde la configuración de su
              dispositivo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              5. PROTECCIÓN DE DATOS PERSONALES Y PRIVACIDAD
            </h2>
            <p className="text-gray-700">
              Para información detallada sobre cómo recopilamos, usamos y
              protegemos sus datos personales, consulte nuestra{" "}
              <Link
                href="/privacidad"
                className="text-blue-600 hover:underline"
              >
                Política de Privacidad
              </Link>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              6. CONDUCTA DEL USUARIO
            </h2>

            <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              6.1. Uso Aceptable
            </h3>
            <p className="text-gray-700">
              Usted se compromete a utilizar la Aplicación de manera legal y de
              acuerdo con estos Términos. Específicamente, usted se compromete
              a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Proporcionar información precisa y veraz.</li>
              <li>Mantener la seguridad de su cuenta.</li>
              <li>Respetar los derechos de otros usuarios.</li>
              <li>
                No utilizar la Aplicación para fines ilegales o no autorizados.
              </li>
              <li>No interferir con el funcionamiento de la Aplicación.</li>
              <li>No intentar acceder no autorizado a sistemas o datos.</li>
              <li>No transmitir virus, malware o código malicioso.</li>
              <li>No suplantar la identidad de otra persona.</li>
              <li>No acosar, amenazar o dañar a otros usuarios.</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              6.2. Prohibiciones Específicas
            </h3>
            <p className="text-gray-700">Está estrictamente prohibido:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Publicar contenido falso, engañoso, difamatorio, obsceno,
                ofensivo o ilegal.
              </li>
              <li>Violar derechos de propiedad intelectual de terceros.</li>
              <li>Realizar actividades fraudulentas o estafas.</li>
              <li>Manipular el sistema de calificaciones o reseñas.</li>
              <li>
                Contactar a otros usuarios fuera de la plataforma para evitar
                comisiones.
              </li>
              <li>
                Utilizar la Aplicación para competir con nuestros servicios.
              </li>
              <li>
                Recopilar información de otros usuarios sin su consentimiento.
              </li>
              <li>
                Utilizar bots, scripts automatizados o métodos no autorizados
                para acceder a la Aplicación.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              7. SERVICIOS DE PRESTADORES
            </h2>
            <p className="text-gray-700">
              Los prestadores de servicios son usuarios independientes y no son
              empleados, agentes o representantes de la Compañía. La relación
              contractual es directamente entre el cliente y el prestador. La
              Compañía no es parte de esta relación y no es responsable por la
              calidad o resultado de los servicios prestados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              8. PAGOS Y TRANSACCIONES
            </h2>
            <p className="text-gray-700">
              La Aplicación puede facilitar el procesamiento de pagos entre
              clientes y prestadores. Los pagos se procesan a través de
              proveedores de servicios de pago de terceros. La Compañía puede
              cobrar comisiones sobre las transacciones realizadas a través de
              la plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              9. PROPIEDAD INTELECTUAL
            </h2>
            <p className="text-gray-700">
              Todos los derechos, títulos e intereses sobre la Aplicación son
              propiedad exclusiva de la Compañía o sus licenciantes y están
              protegidos por leyes de propiedad intelectual. Se le otorga una
              licencia limitada, no exclusiva, no transferible y revocable para
              descargar e instalar la Aplicación en dispositivos personales.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              10. TERMINACIÓN
            </h2>
            <p className="text-gray-700">
              Puede terminar su cuenta en cualquier momento. Nos reservamos el
              derecho de suspender o terminar su acceso a la Aplicación en
              cualquier momento, con o sin causa, por cualquier motivo,
              incluyendo violación de estos Términos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              11. DISCLAIMER DE GARANTÍAS
            </h2>
            <p className="uppercase font-semibold text-gray-900">
              LA APLICACIÓN SE PROPORCIONA "TAL CUAL" Y "SEGÚN DISPONIBILIDAD",
              SIN GARANTÍAS DE NINGÚN TIPO, EXPRESAS O IMPLÍCITAS.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              12. LIMITACIÓN DE RESPONSABILIDAD
            </h2>
            <p className="uppercase font-semibold text-gray-900">
              EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE, EN NINGÚN CASO
              LA COMPAÑÍA SERÁ RESPONSABLE POR DAÑOS INDIRECTOS, INCIDENTALES,
              ESPECIALES, CONSECUENCIALES O PUNITIVOS.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              13. INDEMNIZACIÓN
            </h2>
            <p className="text-gray-700">
              Usted acepta indemnizar, defender y mantener indemne a la Compañía
              de y contra todas las reclamaciones, demandas, pérdidas,
              responsabilidades, daños, costos y gastos que surjan de su uso de
              la Aplicación o violación de estos Términos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              14. RESOLUCIÓN DE DISPUTAS
            </h2>
            <p className="text-gray-700">
              Las disputas entre usuarios deben resolverse directamente entre
              las partes. Si tiene una disputa con la Compañía, debe intentar
              resolverla primero contactándonos directamente. Las disputas se
              resolverán mediante arbitraje vinculante según las reglas del
              Centro de Mediación y Arbitraje de la Cámara de Comercio de La
              Rioja, o mediante los tribunales competentes de la Provincia de La
              Rioja, Argentina.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              15. CAMBIOS EN LOS TÉRMINOS
            </h2>
            <p className="text-gray-700">
              Nos reservamos el derecho de modificar estos Términos en cualquier
              momento. Le notificaremos sobre cambios materiales mediante
              notificación dentro de la Aplicación, correo electrónico o
              publicación en nuestro sitio web. Su uso continuado de la
              Aplicación después de que los cambios entren en vigor constituirá
              su aceptación de los Términos modificados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              16. DISPOSICIONES GENERALES
            </h2>
            <p className="text-gray-700">
              Estos Términos se rigen e interpretan de acuerdo con las leyes de
              la Provincia de La Rioja, Argentina. Si alguna disposición se
              considera inválida o inaplicable, las disposiciones restantes
              permanecerán en pleno vigor y efecto.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              17. INFORMACIÓN DE CONTACTO
            </h2>
            <p className="text-gray-700">
              Si tiene preguntas, comentarios o inquietudes sobre estos Términos
              o la Aplicación, puede contactarnos a través de:
            </p>
            <ul className="list-none space-y-2 mt-4 text-gray-700">
              <li>
                <strong className="text-gray-900">Correo electrónico:</strong>{" "}
                <a
                  href="mailto:info@ofisi.ar"
                  className="text-blue-600 hover:underline"
                >
                  info@ofisi.ar
                </a>
              </li>
              <li>
                <strong className="text-gray-900">Dirección postal:</strong> San
                Nicolas de Bari 98, La Rioja, La Rioja, Argentina
              </li>
              <li>
                <strong className="text-gray-900">Teléfono:</strong>{" "}
                <a
                  href="tel:+543804828899"
                  className="text-blue-600 hover:underline"
                >
                  +543804828899
                </a>
              </li>
              <li>
                <strong className="text-gray-900">Sitio web:</strong>{" "}
                <a
                  href="https://ofisi.ar"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://ofisi.ar
                </a>
              </li>
            </ul>
            <p className="mt-4 text-gray-700">
              Para asuntos relacionados con privacidad y protección de datos:
            </p>
            <p className="text-gray-700">
              <strong className="text-gray-900">Email de privacidad:</strong>{" "}
              <a
                href="mailto:priv@ofisi.ar"
                className="text-blue-600 hover:underline"
              >
                priv@ofisi.ar
              </a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              18. IDIOMA
            </h2>
            <p className="text-gray-700">
              Estos Términos pueden estar disponibles en múltiples idiomas. En
              caso de discrepancia entre versiones, la versión en Español
              prevalecerá.
            </p>
          </section>
        </article>

        <div className="mt-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
