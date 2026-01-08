import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad - ofiSí",
  description: "Política de Privacidad de ofiSí",
};

export default function PrivacidadPage() {
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
            POLÍTICA DE PRIVACIDAD
          </h1>
          <h2 className="text-2xl text-gray-600 mb-8">
            ofiSí - Plataforma de Servicios y Oficios
          </h2>

          <p className="text-sm text-gray-500 mb-8">
            <strong className="text-gray-700">Última actualización:</strong>{" "}
            01/01/2026
          </p>

          <hr className="my-8" />

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              1. INTRODUCCIÓN
            </h2>
            <p className="text-gray-700">
              OyD SRL ("nosotros", "nuestro" o la "Compañía") se compromete a
              proteger su privacidad. Esta Política de Privacidad explica cómo
              recopilamos, usamos, divulgamos y protegemos su información
              personal cuando utiliza nuestra aplicación móvil "ofiSi" (la
              "Aplicación" o el "Servicio").
            </p>
            <p className="text-gray-700">
              Al utilizar la Aplicación, usted acepta las prácticas descritas en
              esta Política de Privacidad. Si no está de acuerdo con esta
              política, no utilice la Aplicación.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              2. INFORMACIÓN QUE RECOPILAMOS
            </h2>

            <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              2.1. Información que Usted Nos Proporciona
            </h3>

            <p className="text-gray-700">
              <strong className="text-gray-900">
                Información de Registro:
              </strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Nombre y apellido.</li>
              <li>Dirección de correo electrónico.</li>
              <li>Número de teléfono.</li>
              <li>Contraseña (almacenada de forma encriptada).</li>
              <li>Tipo de usuario (cliente, prestador o ambos).</li>
            </ul>

            <p className="mt-4 text-gray-700">
              <strong className="text-gray-900">Información de Perfil:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Fotografía de perfil.</li>
              <li>Dirección física (para prestadores de servicios).</li>
              <li>Ubicación geográfica (coordenadas GPS).</li>
              <li>Información profesional y experiencia.</li>
              <li>Certificaciones y documentos profesionales.</li>
              <li>Portfolio de trabajos realizados.</li>
              <li>Descripción de servicios ofrecidos.</li>
            </ul>

            <p className="mt-4 text-gray-700">
              <strong className="text-gray-900">
                Información de Servicios:
              </strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Solicitudes de servicios creadas.</li>
              <li>Cotizaciones y presupuestos.</li>
              <li>Mensajes y comunicaciones con otros usuarios.</li>
              <li>Calificaciones y reseñas.</li>
              <li>Información de pagos y transacciones.</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              2.2. Información Recopilada Automáticamente
            </h3>

            <p className="text-gray-700">
              <strong className="text-gray-900">Información de Uso:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Actividad en la Aplicación (páginas visitadas, funciones
                utilizadas)
              </li>
              <li>Fechas y horas de acceso.</li>
              <li>Búsquedas realizadas.</li>
              <li>Interacciones con otros usuarios.</li>
              <li>Preferencias y configuraciones.</li>
            </ul>

            <p className="mt-4 text-gray-700">
              <strong className="text-gray-900">
                Información del Dispositivo:
              </strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Tipo de dispositivo (móvil, tablet).</li>
              <li>Sistema operativo y versión.</li>
              <li>Identificador único del dispositivo</li>
              <li>
                Dirección IP. (Solo cuando la Aplicación está en uso activo
                (foreground))
              </li>
              <li>
                Tipo de conexión a internet. (Solo cuando la Aplicación está en
                uso activo (foreground))
              </li>
            </ul>

            <p className="mt-4 text-gray-700">
              <strong className="text-gray-900">
                Información de Ubicación:
              </strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Coordenadas GPS (latitud y longitud). (Solo cuando la Aplicación
                está en uso activo (foreground))
              </li>
              <li>
                Precisión de la ubicación. (Solo cuando la Aplicación está en
                uso activo (foreground)){" "}
              </li>
              <li>
                Timestamp de la ubicación. (Solo cuando la Aplicación está en
                uso activo (foreground))
              </li>
              <li>
                Solo cuando la Aplicación está en uso activo (foreground).
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              3. CÓMO UTILIZAMOS SU INFORMACIÓN
            </h2>
            <p className="text-gray-700">
              Utilizamos la información recopilada para los siguientes fines:
            </p>

            <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              3.1. Proporcionar y Mejorar el Servicio
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Crear y gestionar su cuenta de usuario.</li>
              <li>Procesar y gestionar solicitudes de servicios.</li>
              <li>Facilitar la comunicación entre clientes y prestadores.</li>
              <li>Procesar pagos y gestionar transacciones.</li>
              <li>Personalizar su experiencia en la Aplicación.</li>
              <li>Mejorar y desarrollar nuevas funcionalidades.</li>
              <li>Detectar, prevenir y abordar problemas técnicos.</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              3.2. Comunicación
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Enviar notificaciones sobre solicitudes, mensajes y
                actualizaciones.
              </li>
              <li>Responder a sus consultas y solicitudes de soporte.</li>
              <li>
                Enviar información importante sobre cambios en nuestros
                servicios o políticas.
              </li>
              <li>
                Enviar comunicaciones promocionales (con su consentimiento).
              </li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              3.3. Verificación y Seguridad
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Verificar su identidad y credenciales.</li>
              <li>Prevenir fraudes y actividades ilegales.</li>
              <li>
                Proteger la seguridad de la Aplicación y de nuestros usuarios.
              </li>
              <li>Cumplir con obligaciones legales.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              4. CÓMO COMPARTIMOS SU INFORMACIÓN
            </h2>

            <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              4.1. Con Otros Usuarios
            </h3>
            <p className="text-gray-700">
              Compartimos cierta información con otros usuarios de la
              plataforma:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Información de perfil pública (nombre, foto, calificaciones).
              </li>
              <li>Información profesional (para prestadores).</li>
              <li>Portfolio de trabajos (para prestadores).</li>
              <li>Ubicación aproximada (no precisa).</li>
              <li>Información de contacto cuando se acuerda un servicio.</li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              4.2. Con Proveedores de Servicios
            </h3>
            <p className="text-gray-700">
              Compartimos información con proveedores de servicios de terceros
              que nos ayudan a operar la Aplicación:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Proveedores de alojamiento.</li>
              <li>Proveedores de pagos.</li>
              <li>Proveedores de análisis.</li>
              <li>Proveedores de notificaciones.</li>
              <li>Proveedores de soporte.</li>
            </ul>
            <p className="mt-4">
              Estos proveedores están contractualmente obligados a proteger su
              información y solo pueden usarla para los fines especificados.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              4.3. Por Razones Legales
            </h3>
            <p className="text-gray-700">
              Podemos divulgar su información cuando sea necesario para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Cumplir con leyes, regulaciones o procesos legales.</li>
              <li>Responder a solicitudes gubernamentales.</li>
              <li>Proteger nuestros derechos, propiedad o seguridad.</li>
              <li>Hacer cumplir nuestros términos y condiciones.</li>
              <li>Prevenir fraudes o actividades ilegales.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              5. PERMISOS DE DISPOSITIVO
            </h2>

            <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              5.1. Cámara
            </h3>
            <p className="text-gray-700">
              <strong className="text-gray-900">Cuándo se solicita:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Cuando desea tomar una foto de perfil.</li>
              <li>
                Cuando desea agregar imágenes a su portfolio (prestadores).
              </li>
              <li>
                Cuando desea documentar un trabajo o solicitud de servicio.
              </li>
            </ul>
            <p className="mt-4">
              <strong>Qué hacemos con las imágenes:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Las almacenamos de forma segura en nuestros servidores.</li>
              <li>
                Las mostramos en su perfil (fotos de perfil y portfolios son
                públicas).
              </li>
              <li>
                Las compartimos con otros usuarios según la funcionalidad del
                servicio.
              </li>
              <li>
                No utilizamos las imágenes para fines distintos a los
                especificados.
              </li>
            </ul>
            <p className="mt-4">
              <strong>Control:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Puede revocar el permiso de cámara en cualquier momento desde la
                configuración de su dispositivo.
              </li>
              <li>
                Puede eliminar sus imágenes en cualquier momento desde la
                Aplicación.
              </li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              5.2. Ubicación
            </h3>
            <p className="text-gray-700">
              <strong className="text-gray-900">Cuándo se solicita:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Durante el registro de prestadores (para establecer ubicación
                base).
              </li>
              <li>Cuando busca servicios cercanos.</li>
              <li>Cuando activa funcionalidades basadas en ubicación.</li>
            </ul>
            <p className="mt-4">
              <strong>Qué hacemos con la ubicación:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>La almacenamos de forma segura en nuestros servidores.</li>
              <li>
                La utilizamos para conectar clientes con prestadores cercanos.
              </li>
              <li>
                Compartimos ubicación aproximada (no precisa) con otros usuarios
                cuando es necesario.
              </li>
              <li>
                No rastreamos su ubicación en segundo plano sin su
                consentimiento explícito.
              </li>
              <li>
                No vendemos ni compartimos datos de ubicación precisos con
                terceros para marketing.
              </li>
            </ul>
            <p className="mt-4">
              <strong>Control:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Puede revocar el permiso de ubicación en cualquier momento desde
                la configuración de su dispositivo
              </li>
              <li>
                Puede ajustar la precisión de la ubicación compartida en la
                configuración de la Aplicación
              </li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              5.3. Almacenamiento
            </h3>
            <p className="text-gray-700">
              Utilizamos almacenamiento para guardar imágenes y archivos
              relacionados con el servicio, y para cachear datos y mejorar el
              rendimiento.
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              5.4. Notificaciones
            </h3>
            <p className="text-gray-700">
              Enviamos notificaciones push sobre nuevas solicitudes de
              servicios, mensajes recibidos, actualizaciones de trabajos e
              información importante del servicio. Puede desactivar las
              notificaciones en cualquier momento desde la configuración del
              dispositivo o la Aplicación.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              6. SEGURIDAD DE LA INFORMACIÓN
            </h2>
            <p className="text-gray-700">
              Implementamos medidas de seguridad técnicas, administrativas y
              físicas para proteger su información personal:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Encriptación</strong>: Utilizamos encriptación SSL/TLS
                para datos en tránsito y encriptación para datos en reposo.
              </li>
              <li>
                <strong>Autenticación</strong>: Requerimos autenticación segura
                para acceder a cuentas.
              </li>
              <li>
                <strong>Control de acceso</strong>: Limitamos el acceso a
                información personal solo a personal autorizado.
              </li>
              <li>
                <strong>Monitoreo</strong>: Monitoreamos regularmente nuestros
                sistemas para detectar y prevenir accesos no autorizados.
              </li>
              <li>
                <strong>Actualizaciones de seguridad</strong>: Mantenemos
                nuestros sistemas actualizados con los últimos parches de
                seguridad.
              </li>
            </ul>
            <p className="mt-4">
              <strong>Limitaciones:</strong> A pesar de nuestros esfuerzos,
              ningún método de transmisión por internet o almacenamiento
              electrónico es 100% seguro. No podemos garantizar la seguridad
              absoluta de su información.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              7. RETENCIÓN DE DATOS
            </h2>
            <p className="text-gray-700">
              Conservamos su información personal durante el tiempo necesario
              para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Cumplir con los fines descritos en esta Política de Privacidad .
              </li>
              <li>
                Cumplir con obligaciones legales, regulatorias o contractuales.
              </li>
              <li>Resolver disputas y hacer cumplir nuestros acuerdos.</li>
              <li>Mantener la seguridad y prevenir fraudes.</li>
            </ul>
            <p className="mt-4">
              <strong>Períodos específicos de retención:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Información de cuenta</strong>: Mientras su cuenta esté
                activa y hasta 3 años después de su cierre.
              </li>
              <li>
                <strong>Información de transacciones</strong>: Según lo
                requerido por ley (generalmente 7 años para fines fiscales).
              </li>
              <li>
                <strong>Logs y registros</strong>: Hasta 2 años.
              </li>
              <li>
                <strong>Información de ubicación</strong>: Mientras su cuenta
                esté activa, eliminada al cerrar la cuenta.
              </li>
              <li>
                <strong>Imágenes</strong>: Mientras su cuenta esté activa,
                eliminadas al eliminar la cuenta o la imagen específica.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              8. SUS DERECHOS DE PRIVACIDAD
            </h2>
            <p className="text-gray-700">
              Dependiendo de su jurisdicción, puede tener los siguientes
              derechos:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Derecho de Acceso</strong>: Solicitar una copia de la
                información personal que tenemos sobre usted.
              </li>
              <li>
                <strong>Derecho de Rectificación</strong>: Solicitar la
                corrección de información inexacta o incompleta.
              </li>
              <li>
                <strong>Derecho de Eliminación</strong>: Solicitar la
                eliminación de su información personal. Puede eliminar su cuenta
                directamente desde{" "}
                <Link
                  href="/eliminar-cuenta"
                  className="text-blue-600 hover:underline"
                >
                  esta página
                </Link>
                .
              </li>
              <li>
                <strong>Derecho de Portabilidad</strong>: Recibir su información
                personal en un formato estructurado.
              </li>
              <li>
                <strong>Derecho de Oposición</strong>: Oponerse al procesamiento
                de su información personal para ciertos fines.
              </li>
              <li>
                <strong>Derecho de Restricción</strong>: Solicitar la
                restricción del procesamiento de su información personal.
              </li>
              <li>
                <strong>Derecho de Retirar Consentimiento</strong>: Retirar su
                consentimiento cuando el procesamiento se base en él.
              </li>
            </ul>
            <p className="mt-4">
              <strong>Cómo Ejercer Sus Derechos:</strong>
            </p>
            <p className="text-gray-700">
              Para ejercer cualquiera de estos derechos, puede:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-gray-700">
              <li>
                <strong>Desde la Aplicación</strong>: Muchas opciones están
                disponibles en la configuración de su cuenta.
              </li>
              <li>
                <strong>Contactándonos</strong>: Envíe un correo electrónico a{" "}
                <a
                  href="mailto:priv@ofisi.ar"
                  className="text-blue-600 hover:underline"
                >
                  priv@ofisi.ar
                </a>{" "}
                con su solicitud.
              </li>
              <li>
                <strong>Por escrito</strong>: Envíe una solicitud por escrito a
                San Nicolas de Bari 98, La Rioja, La Rioja, Argentina.
              </li>
            </ol>
            <p className="mt-4">
              Responderemos a su solicitud dentro de un plazo razonable
              (generalmente dentro de 30 días). No discriminaremos contra usted
              por ejercer sus derechos de privacidad.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              9. TRANSFERENCIAS INTERNACIONALES DE DATOS
            </h2>
            <p className="text-gray-700">
              Su información puede ser transferida y procesada en Argentina. Al
              utilizar la Aplicación, usted consiente la transferencia de su
              información a este país. Implementamos salvaguardas apropiadas
              para proteger su información durante estas transferencias.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              10. PRIVACIDAD DE MENORES
            </h2>
            <p className="text-gray-700">
              La Aplicación no está dirigida a menores de 18 años. No
              recopilamos intencionalmente información personal de menores de 18
              años. Si descubrimos que hemos recopilado información personal de
              un menor sin el consentimiento de los padres, tomaremos medidas
              para eliminar esa información de nuestros servidores.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              11. COOKIES Y TECNOLOGÍAS SIMILARES
            </h2>
            <p className="text-gray-700">
              La Aplicación puede utilizar cookies y tecnologías similares para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Recordar sus preferencias.</li>
              <li>Mejorar la funcionalidad de la Aplicación.</li>
              <li>Analizar el uso de la Aplicación.</li>
              <li>Personalizar su experiencia.</li>
            </ul>
            <p className="mt-4 text-gray-700">
              Puede controlar el uso de cookies a través de la configuración de
              su dispositivo o navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              12. ENLACES A TERCEROS
            </h2>
            <p className="text-gray-700">
              La Aplicación puede contener enlaces a sitios web o servicios de
              terceros. No somos responsables de las prácticas de privacidad de
              estos terceros. Le recomendamos leer las políticas de privacidad
              de cualquier sitio web o servicio de terceros que visite.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              13. CAMBIOS EN ESTA POLÍTICA DE PRIVACIDAD
            </h2>
            <p className="text-gray-700">
              Podemos actualizar esta Política de Privacidad de vez en cuando.
              Le notificaremos sobre cambios materiales mediante notificación
              dentro de la Aplicación, correo electrónico o publicación en
              nuestro sitio web. La fecha de "Última actualización" en la parte
              superior de esta política indica cuándo se realizó la última
              revisión.
            </p>
            <p className="mt-4 text-gray-700">
              Su uso continuado de la Aplicación después de que los cambios
              entren en vigor constituirá su aceptación de la Política de
              Privacidad modificada. Si no está de acuerdo con los cambios, debe
              dejar de utilizar la Aplicación y puede solicitar la eliminación
              de su cuenta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              14. CUMPLIMIENTO REGULATORIO
            </h2>

            <h3 className="text-2xl font-semibold mb-3 text-gray-800">
              14.1. GDPR (Reglamento General de Protección de Datos)
            </h3>
            <p className="text-gray-700">
              Para usuarios en la Unión Europea, cumplimos con el GDPR. Nuestras
              bases legales para el procesamiento incluyen:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Consentimiento</li>
              <li>Ejecución de contrato</li>
              <li>Obligación legal</li>
              <li>Intereses legítimos</li>
            </ul>
            <p className="mt-4">
              <strong>Delegado de Protección de Datos (DPO):</strong> Si tiene
              preguntas sobre el procesamiento de sus datos personales bajo el
              GDPR, puede contactar a nuestro DPO en{" "}
              <a
                href="mailto:priv@ofisi.ar"
                className="text-blue-600 hover:underline"
              >
                priv@ofisi.ar
              </a>
              .
            </p>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              14.2. CCPA (California Consumer Privacy Act)
            </h3>
            <p className="text-gray-700">
              Para usuarios en California, cumplimos con el CCPA:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>No vendemos datos personales</li>
              <li>Respetamos los derechos del consumidor</li>
              <li>
                No discriminamos contra usuarios que ejercen sus derechos de
                privacidad.
              </li>
            </ul>

            <h3 className="text-2xl font-semibold mb-3 mt-6 text-gray-800">
              14.3. Otras Leyes de Protección de Datos
            </h3>
            <p className="text-gray-700">
              Cumplimos con las leyes de protección de datos aplicables en todas
              las jurisdicciones donde operamos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              15. CONTACTO
            </h2>
            <p className="text-gray-700">
              Si tiene preguntas, comentarios o inquietudes sobre esta Política
              de Privacidad o nuestras prácticas de privacidad, puede
              contactarnos:
            </p>

            <p className="mt-4">
              <strong>Información de Contacto General:</strong>
            </p>
            <ul className="list-none space-y-2 text-gray-700">
              <li>
                <strong>Correo electrónico:</strong>{" "}
                <a
                  href="mailto:info@ofisi.ar"
                  className="text-blue-600 hover:underline"
                >
                  info@ofisi.ar
                </a>
              </li>
              <li>
                <strong>Dirección postal:</strong> San Nicolas de Bari 98, La
                Rioja, La Rioja, Argentina
              </li>
              <li>
                <strong>Teléfono:</strong>{" "}
                <a
                  href="tel:+543804828899"
                  className="text-blue-600 hover:underline"
                >
                  +543804828899
                </a>
              </li>
            </ul>

            <p className="mt-4">
              <strong>Para Asuntos de Privacidad:</strong>
            </p>
            <ul className="list-none space-y-2 text-gray-700">
              <li>
                <strong>Email de privacidad:</strong>{" "}
                <a
                  href="mailto:priv@ofisi.ar"
                  className="text-blue-600 hover:underline"
                >
                  priv@ofisi.ar
                </a>
              </li>
              <li>
                <strong>Delegado de Protección de Datos (DPO):</strong>{" "}
                <a
                  href="mailto:priv@ofisi.ar"
                  className="text-blue-600 hover:underline"
                >
                  priv@ofisi.ar
                </a>
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              16. IDIOMA
            </h2>
            <p className="text-gray-700">
              Esta Política de Privacidad puede estar disponible en múltiples
              idiomas. En caso de discrepancia entre versiones, la versión en
              Español prevalecerá.
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
