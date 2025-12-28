import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
        <div className="absolute inset-0 bg-grid-blue-500/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 flex justify-center">
              <img
                src="/logo-color.png"
                alt="ofiSí Logo"
                width={200}
                height={200}
                className="h-auto"
                style={{ maxWidth: "200px", height: "auto" }}
              />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-gray-900">
              Encuentra el oficio o servicio
              <br />
              <span className="text-orange-500">que necesitas</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-600">
              La plataforma para encontrar todos los oficios o servicios cerca
              tuyo.
              <br />
              Rápido, seguro y confiable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#download"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Descargar App
              </Link>
              <Link
                href="#features"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all border border-blue-600 shadow-lg hover:shadow-xl"
              >
                Ver Funcionalidades
              </Link>
            </div>
          </div>
        </div>
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto"></p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Busca Servicios
              </h3>
              <p className="text-gray-600 mb-4">
                Encuentra profesionales cerca de ti con nuestro sistema de
                búsqueda inteligente por categorías y ubicación.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>✓ Búsqueda por categorías</li>
                <li>✓ Filtros avanzados</li>
                <li>✓ Verificaciones de calidad</li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Solicita Presupuestos
              </h3>
              <p className="text-gray-600 mb-4">
                Recibe múltiples cotizaciones de profesionales para comparar
                precios y elegir la mejor opción.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>✓ Múltiples cotizaciones</li>
                <li>✓ Compara precios</li>
                <li>✓ Negociación directa</li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">⭐</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Calificaciones Reales
              </h3>
              <p className="text-gray-600 mb-4">
                Sistema bidireccional de calificaciones para garantizar la
                calidad del servicio y construir confianza.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>✓ Calificaciones verificadas</li>
                <li>✓ Reseñas honestas</li>
                <li>✓ Perfiles confiables</li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-orange-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">💼</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Gestiona Trabajos
              </h3>
              <p className="text-gray-600 mb-4">
                Control total sobre tus trabajos, desde la solicitud hasta la
                finalización y pago.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>✓ Seguimiento en tiempo real</li>
                <li>✓ Estados de trabajo</li>
                <li>✓ Historial completo</li>
              </ul>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Mensajería Integrada
              </h3>
              <p className="text-gray-600 mb-4">
                Comunícate directamente con profesionales o clientes a través de
                nuestro sistema de mensajería seguro.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>✓ Chat en tiempo real</li>
                <li>✓ Notificaciones push</li>
                <li>✓ Historial de conversaciones</li>
              </ul>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-8 hover:shadow-xl transition-all transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-pink-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Portfolio Profesional
              </h3>
              <p className="text-gray-600 mb-4">
                Los profesionales pueden mostrar su trabajo anterior para
                generar confianza y atraer más clientes.
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>✓ Galería de trabajos</li>
                <li>✓ Certificaciones</li>
                <li>✓ Experiencia verificada</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Así de fácil funciona
            </h2>
            <p className="text-xl text-gray-600">
              En solo 3 pasos, encuentra el profesional perfecto
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Busca</h3>
              <p className="text-gray-600">
                Busca el servicio que necesitas usando nuestro carrusel de
                categorías o búsqueda por nombre.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Compara</h3>
              <p className="text-gray-600">
                Revisa perfiles, calificaciones y solicita presupuestos a
                múltiples profesionales.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Contrata
              </h3>
              <p className="text-gray-600">
                Elige el profesional ideal, coordina el trabajo y califica la
                experiencia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Professionals Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  ¿Quieres ofrecer tus servicios?
                  <br />
                  <span className="text-blue-600">Únete a ofiSí</span>
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Gestiona tu negocio, encuentra nuevos clientes y haz crecer tu
                  cartera de trabajos.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <span className="text-green-500 text-2xl mr-4">✓</span>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">
                        Recibe Solicitudes
                      </h4>
                      <p className="text-gray-600">
                        Clientes te encuentran y solicitan tus servicios
                        directamente.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 text-2xl mr-4">✓</span>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">
                        Gestiona Cotizaciones
                      </h4>
                      <p className="text-gray-600">
                        Envía presupuestos, negocia precios y acepta trabajos
                        fácilmente.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 text-2xl mr-4">✓</span>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">
                        Construye tu Reputación
                      </h4>
                      <p className="text-gray-600">
                        Muestra tu portfolio, certificaciones y calificaciones
                        para destacar.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 text-2xl mr-4">✓</span>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">
                        Control Total
                      </h4>
                      <p className="text-gray-600">
                        Gestiona trabajos, comunicaciones y pagos desde una sola
                        app.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Beneficios</h3>
                <div className="space-y-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <div className="font-bold text-lg mb-2">
                      🚀 Más Visibilidad
                    </div>
                    <p className="text-blue-100">
                      Llega a más clientes en tu zona
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <div className="font-bold text-lg mb-2">
                      📈 Gestiona tu Negocio
                    </div>
                    <p className="text-blue-100">
                      Todo en un solo lugar, fácil y rápido
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <div className="font-bold text-lg mb-2">
                      ⭐ Construye Confianza
                    </div>
                    <p className="text-blue-100">
                      Muestra tu trabajo y recibe calificaciones
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <div className="font-bold text-lg mb-2">
                      💰 Más Oportunidades
                    </div>
                    <p className="text-blue-100">
                      Aumenta tu cartera de clientes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Clients Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                  ¿Quieres contratar un oficio o servicio?
                  <br />
                  <span className="text-amber-500">Encuéntralo en ofiSí</span>
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Encuentra el oficio o servicio que necesitas cerca de ti de
                  forma rápida, segura y confiable.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <span className="text-amber-500 text-2xl mr-4">✓</span>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">
                        Busca y Compara
                      </h4>
                      <p className="text-gray-600">
                        Encuentra oficios o servicios por categorías o ubicación
                        y compara múltiples opciones.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-500 text-2xl mr-4">✓</span>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">
                        Solicita Presupuestos
                      </h4>
                      <p className="text-gray-600">
                        Recibe múltiples cotizaciones para comparar precios y
                        elegir la mejor opción.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-500 text-2xl mr-4">✓</span>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">
                        Califica y Opina
                      </h4>
                      <p className="text-gray-600">
                        Deja tu opinión y califica la experiencia para ayudar a
                        otros usuarios.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-amber-500 text-2xl mr-4">✓</span>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">
                        Seguimiento en Tiempo Real
                      </h4>
                      <p className="text-gray-600">
                        Monitorea el progreso de tu trabajo desde la solicitud
                        hasta la finalización.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Beneficios</h3>
                <div className="space-y-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <div className="font-bold text-lg mb-2">
                      🔍 Encuentra Rápido
                    </div>
                    <p className="text-amber-100">
                      Busca por categoría o ubicación cerca de ti
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <div className="font-bold text-lg mb-2">
                      💰 Mejor Precio
                    </div>
                    <p className="text-amber-100">
                      Compara múltiples presupuestos y elige el mejor
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <div className="font-bold text-lg mb-2">⭐ Confiable</div>
                    <p className="text-amber-100">
                      Revisa calificaciones y reseñas antes de contratar
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                    <div className="font-bold text-lg mb-2">🛡️ Seguro</div>
                    <p className="text-amber-100">
                      Trabajamos solo con personas verificadas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Button Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Link
              href="#download"
              className="inline-block bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-12 py-5 rounded-full text-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Crea tu usuario gratis
            </Link>
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Seguro, Verificado y Confiable
            </h2>
            <p className="text-xl text-gray-300 mb-12">
              Tu seguridad y privacidad son nuestra prioridad
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-xl font-bold mb-2">
                  Verificación por WhatsApp
                </h3>
                <p className="text-gray-400">
                  Confirmamos tu identidad con código de verificación
                </p>
              </div>
              <div>
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold mb-2">
                  Oficios/servicios Verificados
                </h3>
                <p className="text-gray-400">
                  Solo trabajamos con personas verificadas y confiables
                </p>
              </div>
              <div>
                <div className="text-5xl mb-4">💳</div>
                <h3 className="text-xl font-bold mb-2">Pagos Seguros</h3>
                <p className="text-gray-400">
                  Los pagos se acuerdan directamente entre el cliente y quien
                  presta el servicio
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="download"
        className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white"
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Descarga la app y comienza a encontrar oficios/servicios o a ofrecer
            tus servicios hoy mismo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              disabled
              className="bg-white/50 text-blue-600/70 px-8 py-4 rounded-full text-lg font-semibold cursor-not-allowed shadow-lg flex items-center gap-3 opacity-75"
            >
              <span className="text-2xl">📱</span>
              <span>Próximamente en App Store</span>
            </button>
            <button
              disabled
              className="bg-white/50 text-blue-600/70 px-8 py-4 rounded-full text-lg font-semibold cursor-not-allowed shadow-lg flex items-center gap-3 opacity-75"
            >
              <span className="text-2xl">🤖</span>
              <span>Próximamente en Google Play</span>
            </button>
          </div>
          <p className="mt-8 text-blue-200 text-sm">
            Próximamente disponible en App Store y Google Play
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <img
                  src="/logo-blanco.png"
                  alt="ofiSí Logo"
                  width={120}
                  height={72}
                  className="h-auto"
                  style={{ maxWidth: "120px", height: "auto" }}
                />
              </div>
              <p className="text-gray-400">
                Conectando profesionales con clientes
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="#features"
                    className="hover:text-white transition"
                  >
                    Funcionalidades
                  </Link>
                </li>
                <li>
                  <Link
                    href="#download"
                    className="hover:text-white transition"
                  >
                    Descargar
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-white transition">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Para Profesionales</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Registrarse
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Cómo funciona
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Tarifas
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Ayuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Contacto
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Términos y Condiciones
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ofiSí. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
