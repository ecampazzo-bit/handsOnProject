import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Linking,
  Share,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import * as Location from "expo-location";
import {
  getPromocionesActivas,
  getPromocionesActivasPorProximidad,
  registrarVistaPromocion,
  registrarClickPromocion,
  Promocion,
} from "../services/promocionService";
import { getCurrentUser } from "../services/authService";
import { colors } from "../constants/colors";
import { openWhatsApp } from "../utils/whatsappUtils";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CAROUSEL_INTERVAL = 7000; // 7 segundos

// Log al cargar el módulo
console.log("🎁 ===== MÓDULO PromocionesScreen CARGADO =====");

const PromocionesScreenComponent: React.FC = () => {
  console.log("🎁 ===== PromocionesScreenComponent RENDERIZADO =====");
  
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tipoUsuario, setTipoUsuario] = useState<
    "cliente" | "prestador" | "ambos" | null
  >(null);
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false); // Flag para evitar recargas innecesarias
  const isMountedRef = useRef(true);
  const carouselStartedRef = useRef(false); // Flag para evitar iniciar carrusel múltiples veces
  const promocionesRef = useRef<Promocion[]>([]); // Referencia para acceder a promociones actuales en intervalos

  // Cargar promociones solo una vez al montar el componente
  useEffect(() => {
    console.log("🎁 ===== useEffect EJECUTADO =====");
    console.log("🎁 hasLoadedRef.current:", hasLoadedRef.current);
    console.log("🎁 isMountedRef.current:", isMountedRef.current);
    console.log("🎁 loading state:", loading);
    
    isMountedRef.current = true;
    
    // Si ya se cargó pero loading sigue siendo true después de un tiempo, forzar recarga
    if (hasLoadedRef.current) {
      console.log("🎁 ⚠️ Ya se intentó cargar antes");
      // Verificar si la carga está colgada después de 3 segundos
      setTimeout(() => {
        setLoading((currentLoading) => {
          if (currentLoading) {
            console.error("🎁 ❌ Carga colgada detectada, reseteando...");
            hasLoadedRef.current = false;
            setError("La carga se interrumpió. Usa el botón Reintentar.");
            return false;
          }
          return currentLoading;
        });
      }, 3000);
      return; // No intentar cargar de nuevo si ya se intentó
    }
    
    // Primera carga
    console.log("🎁 ✅ Llamando a loadPromociones() por primera vez...");
    hasLoadedRef.current = true; // Marcar como intentado ANTES de llamar
    
    // Llamar loadPromociones y manejar errores
    loadPromociones().catch((err) => {
      console.error("🎁 ❌ Error capturado en useEffect:", err);
      hasLoadedRef.current = false; // Permitir reintento
      setLoading(false);
      setError(err instanceof Error ? err.message : "Error al cargar promociones");
    });

    return () => {
      isMountedRef.current = false;
      // Limpiar intervalo al desmontar
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // NO recargar promociones cuando se enfoca - solo asegurar que el carrusel esté corriendo
  useFocusEffect(
    useCallback(() => {
      // NO hacer nada al enfocar - evitar recargas innecesarias
      // El carrusel se iniciará automáticamente cuando las promociones se carguen
      return () => {
        // NO limpiar el intervalo al desenfocar
      };
    }, []) // Sin dependencias para evitar re-ejecuciones
  );

  // Actualizar referencia cuando cambian las promociones
  useEffect(() => {
    promocionesRef.current = promociones;
  }, [promociones]);

  // Configurar carrusel automático cuando las promociones se cargan (solo una vez)
  useEffect(() => {
    // Solo iniciar carrusel cuando se cargan las promociones (no durante loading) y no se ha iniciado antes
    if (
      promociones.length > 1 &&
      !loading &&
      !intervalRef.current &&
      !carouselStartedRef.current
    ) {
      // Delay para asegurar que las imágenes estén renderizadas y evitar parpadeos
      const timer = setTimeout(() => {
        // Verificar usando la referencia para asegurar que tenemos el valor más actualizado
        if (
          !isMountedRef.current ||
          promocionesRef.current.length <= 1 ||
          intervalRef.current ||
          carouselStartedRef.current
        ) {
          return;
        }

        // Iniciar carrusel directamente aquí para evitar problemas de dependencias
        carouselStartedRef.current = true;

        intervalRef.current = setInterval(() => {
          // Usar referencia para obtener promociones actuales (siempre actualizado)
          const currentPromociones = promocionesRef.current;

          if (!isMountedRef.current || currentPromociones.length <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return;
          }

          setCurrentIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % currentPromociones.length;

            // Scroll al siguiente índice con verificación
            if (
              scrollViewRef.current &&
              isMountedRef.current &&
              currentPromociones.length > 1
            ) {
              scrollViewRef.current.scrollTo({
                x: nextIndex * SCREEN_WIDTH,
                animated: true,
              });
            }

            // Registrar vista de la nueva promoción (de forma asíncrona)
            if (currentPromociones[nextIndex]) {
              setTimeout(() => {
                if (isMountedRef.current) {
                  registrarVistaPromocion(currentPromociones[nextIndex].id);
                }
              }, 0);
            }

            return nextIndex;
          });
        }, CAROUSEL_INTERVAL);
      }, 800); // Delay para dar tiempo a que las imágenes carguen (reducido de 1200ms)

      return () => {
        clearTimeout(timer);
      };
    }

    return () => {
      // Solo limpiar si el componente se desmonta
      if (!isMountedRef.current && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        carouselStartedRef.current = false;
      }
    };
  }, [promociones.length, loading]); // Dependencias mínimas

  // Helper para agregar timeout a promesas
  const withTimeout = <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      ),
    ]);
  };

  const loadPromociones = async (forceReload: boolean = false) => {
    try {
      console.log("🎁 ===== loadPromociones INICIADO =====");
      console.log("🎁 Parámetros:", { forceReload, loading, hasLoaded: hasLoadedRef.current });
      
      // Prevenir múltiples cargas simultáneas, a menos que sea forzada
      if (loading && !forceReload) {
        console.log("⏸️ Carga ya en progreso, omitiendo...");
        return;
      }
      
      console.log("🎁 Continuando con la carga...");
    } catch (earlyError) {
      console.error("🎁 ❌ Error temprano en loadPromociones:", earlyError);
      setLoading(false);
      setError("Error al iniciar la carga de promociones");
      return;
    }

    const startTime = Date.now();
    const MAX_TOTAL_TIME = 10000; // 10 segundos máximo total (aumentado de 5)

    try {
      console.log("🔄 setLoading(true) ejecutado");
      setLoading(true);
      setError(null); // Limpiar errores previos
      console.log("🔄 Iniciando carga de promociones...", { forceReload, startTime });
      
      // Resetear flag si es recarga forzada
      if (forceReload) {
        hasLoadedRef.current = false;
      }

      // Declarar variables al inicio
      let promocionesActivas: Promocion[] = [];
      let tipo: "cliente" | "prestador" | "ambos" | null = null;

      // Obtener tipo de usuario en paralelo (con timeout muy corto)
      // Si falla, continuar sin tipo (las promociones generales deberían estar disponibles)
      const userPromise = getCurrentUser().catch((err) => {
        console.log("⚠️ Error obteniendo usuario, continuando sin tipo:", err);
        console.log("ℹ️ Se cargarán promociones generales disponibles para todos");
        return { user: null, error: null };
      });

      // Solicitar permisos de ubicación en paralelo (con timeout corto)
      const permissionsPromise = Location.getForegroundPermissionsAsync()
        .catch(() => Location.requestForegroundPermissionsAsync())
        .catch((err) => {
          console.log("⚠️ Error obteniendo permisos:", err);
          return { status: "denied" };
        });

      // Ejecutar ambas en paralelo con timeout corto
      try {
        const [userResult, permissionsResult] = await Promise.all([
          withTimeout(userPromise, 1500, "Timeout usuario"),
          withTimeout(permissionsPromise, 1000, "Timeout permisos"),
        ]);

        if (userResult?.user) {
          tipo = userResult.user.tipo_usuario || null;
          setTipoUsuario(tipo);
          console.log(`👤 Tipo de usuario detectado: ${tipo}`);
        } else {
          console.log("👤 No hay usuario autenticado, cargando promociones generales");
          tipo = null; // Asegurar que tipo sea null si no hay usuario
        }

        const status = permissionsResult?.status || "denied";
        console.log(`📍 Estado de permisos: ${status}`);

        // Si no hay permisos o no se obtuvieron, ir directo a promociones globales
        if (status !== "granted") {
          setLocationPermissionGranted(false);
          console.log(
            "📍 Sin permisos de ubicación, usando promociones globales"
          );

          // Ir directo a promociones globales (caso más común)
          const globalPromise = getPromocionesActivas(tipo);
          const timeElapsed = Date.now() - startTime;
          const timeRemaining = Math.max(2000, MAX_TOTAL_TIME - timeElapsed); // Al menos 2 segundos

          console.log(`⏱️ Tiempo restante: ${timeRemaining}ms`);
          promocionesActivas = await withTimeout(
            globalPromise,
            timeRemaining,
            "Timeout cargando promociones globales"
          );
        } else {
          // Hay permisos - intentar obtener ubicación rápidamente
          setLocationPermissionGranted(true);
          console.log("📍 Permisos concedidos, obteniendo ubicación...");

          try {
            const locationPromise = Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low, // Cambiar a Low para ser más rápido
              maximumAge: 120000, // Usar caché de hasta 2 minutos
              timeout: 1500, // Timeout nativo de 1.5 segundos
            });

            const location = await withTimeout(
              locationPromise,
              2000,
              "Timeout ubicación"
            );
            const { latitude, longitude } = location.coords;
            console.log(`📍 Ubicación obtenida: ${latitude}, ${longitude}`);

            // Intentar promociones por proximidad con timeout corto
            const timeElapsed = Date.now() - startTime;
            const timeRemaining = Math.max(
              2000,
              MAX_TOTAL_TIME - timeElapsed - 500
            ); // Dejar 500ms de margen

            try {
              const promocionesPromise = getPromocionesActivasPorProximidad(
                latitude,
                longitude,
                tipo,
                null,
                50
              );

              promocionesActivas = await withTimeout(
                promocionesPromise,
                timeRemaining,
                "Timeout promociones por proximidad"
              );
            } catch (proximityError) {
              console.log(
                "⚠️ Error en promociones por proximidad, usando globales:",
                proximityError
              );
              // Fallback inmediato a globales
              const globalPromise = getPromocionesActivas(tipo);
              const remainingTime = Math.max(
                2000,
                MAX_TOTAL_TIME - (Date.now() - startTime)
              );
              promocionesActivas = await withTimeout(
                globalPromise,
                remainingTime,
                "Timeout globales (fallback)"
              );
            }
          } catch (locationError) {
            console.log(
              "⚠️ Error obteniendo ubicación, usando promociones globales:",
              locationError
            );
            setLocationPermissionGranted(false);
            // Fallback inmediato a globales
            const globalPromise = getPromocionesActivas(tipo);
            const remainingTime = Math.max(
              2000,
              MAX_TOTAL_TIME - (Date.now() - startTime)
            );
            promocionesActivas = await withTimeout(
              globalPromise,
              remainingTime,
              "Timeout globales (fallback)"
            );
          }
        }
      } catch (parallelError) {
        console.error(
          "⚠️ Error en operaciones paralelas, usando promociones globales:",
          parallelError
        );
        setLocationPermissionGranted(false);
        // Fallback final - intentar obtener solo usuario si falló todo
        try {
          const userResult = await withTimeout(
            getCurrentUser(),
            1000,
            "Timeout usuario (fallback)"
          );
          tipo = userResult?.user?.tipo_usuario || null;
          setTipoUsuario(tipo);
        } catch (userError) {
          console.log("⚠️ No se pudo obtener usuario:", userError);
        }

        // Intentar cargar promociones globales
        try {
          const globalPromise = getPromocionesActivas(tipo);
          const remainingTime = Math.max(
            2000,
            MAX_TOTAL_TIME - (Date.now() - startTime)
          );
          promocionesActivas = await withTimeout(
            globalPromise,
            remainingTime,
            "Timeout globales (fallback final)"
          );
        } catch (finalError: any) {
          console.error("❌ Error final al cargar promociones:", finalError);
          const errorMessage = finalError?.message || "Error desconocido al cargar promociones";
          console.error("Mensaje de error:", errorMessage);
          // Si todo falla, dejar array vacío para mostrar mensaje
          promocionesActivas = [];
          if (isMountedRef.current) {
            setError(errorMessage);
          }
        }
      }

      const elapsedTime = Date.now() - startTime;
      console.log(
        `⏱️ Promociones cargadas en ${elapsedTime}ms. Total: ${promocionesActivas.length}`
      );

      // Solo actualizar estado si el componente está montado
      if (isMountedRef.current) {
        promocionesRef.current = promocionesActivas; // Actualizar referencia primero
        setPromociones(promocionesActivas);
        setCurrentIndex(0);
        carouselStartedRef.current = false; // Resetear flag cuando se cargan nuevas promociones

        // Resetear scroll al inicio (sin animación para evitar parpadeos)
        if (scrollViewRef.current) {
          // Usar requestAnimationFrame para asegurar que el render está completo
          requestAnimationFrame(() => {
            if (scrollViewRef.current && isMountedRef.current) {
              scrollViewRef.current.scrollTo({ x: 0, animated: false });
            }
          });
        }

        // Registrar vista de la primera promoción (de forma asíncrona, sin bloquear)
        if (promocionesActivas.length > 0) {
          // No esperar esta llamada - hacerla en background
          setTimeout(() => {
            if (isMountedRef.current) {
              registrarVistaPromocion(promocionesActivas[0].id).catch((err) =>
                console.error("Error registrando vista:", err)
              );
            }
          }, 0);
        }
      }
    } catch (error: any) {
      console.error("🎁 ===== ERROR EN loadPromociones =====");
      console.error("Error al cargar promociones:", error);
      console.error("Tipo de error:", typeof error);
      console.error("Error es Error?", error instanceof Error);
      const elapsedTime = Date.now() - startTime;
      console.error(`⏱️ Error después de ${elapsedTime}ms`);
      console.error("Detalles del error:", JSON.stringify(error, null, 2));
      console.error("Stack trace:", error?.stack);

      if (isMountedRef.current) {
        const errorMessage = error?.message || "Error desconocido al cargar promociones";
        setError(errorMessage);
        
        // Si hubo error pero el tiempo fue largo, puede ser timeout - mostrar array vacío
        if (error instanceof Error && error.message.includes("Timeout")) {
          console.log("⏱️ Timeout alcanzado, mostrando estado vacío");
          promocionesRef.current = [];
          setPromociones([]);
        } else {
          // Para otros errores, también mostrar array vacío
          promocionesRef.current = [];
          setPromociones([]);
          console.error("Error completo:", error);
        }
      }
    } finally {
      console.log("🎁 ===== FINALLY EJECUTADO =====");
      console.log("🎁 isMountedRef.current:", isMountedRef.current);
      if (isMountedRef.current) {
        console.log("🎁 setLoading(false) ejecutado");
        setLoading(false);
        const totalTime = Date.now() - startTime;
        console.log(`✅ Carga de promociones completada en ${totalTime}ms`);
        console.log("🎁 Estado final:", { loading: false, promocionesCount: promociones.length });
      } else {
        console.log("🎁 ⚠️ Componente desmontado, no actualizando estado");
      }
    }
  };

  // Función para iniciar carrusel (usada internamente por useEffect)
  // Ya no se exporta ni se usa directamente para evitar problemas de dependencias

  const handleWhatsApp = async (promocion: Promocion) => {
    try {
      // Registrar click
      await registrarClickPromocion(promocion.id);

      // Obtener nombre del usuario
      const { user } = await getCurrentUser();
      const nombreUsuario = user
        ? `${user.nombre} ${user.apellido}`.trim()
        : "Usuario";

      // Verificar que haya número de WhatsApp
      if (!promocion.whatsapp) {
        Alert.alert(
          "Error",
          "Esta promoción no tiene un número de WhatsApp configurado"
        );
        return;
      }

      // Usar código de cupón en lugar del nombre de la promoción
      const codigoCupon = promocion.codigo_cupon || promocion.titulo;
      const mensaje = `${nombreUsuario}: Quiero mi promoción "${codigoCupon}"`;

      await openWhatsApp(promocion.whatsapp, mensaje);
    } catch (error) {
      console.error("Error al abrir WhatsApp:", error);
      Alert.alert("Error", "No se pudo abrir WhatsApp");
    }
  };

  const handleShare = async (promocion: Promocion) => {
    try {
      // Registrar click
      await registrarClickPromocion(promocion.id);

      // Crear mensaje para compartir
      let mensaje = `🔥 Promoción Especial: ${promocion.titulo}\n\n`;
      if (promocion.descripcion) {
        mensaje += `${promocion.descripcion}\n\n`;
      }
      if (promocion.codigo_cupon) {
        mensaje += `🎟️ Código: ${promocion.codigo_cupon}\n\n`;
      }
      if (promocion.whatsapp) {
        mensaje += `📱 Contacto: ${promocion.whatsapp}`;
      }

      const shareOptions: any = {
        message: mensaje,
        title: promocion.titulo,
      };

      // Si hay imagen, agregarla
      if (promocion.imagen_url) {
        shareOptions.url = promocion.imagen_url;
      }

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        console.log("Promoción compartida exitosamente");
      }
    } catch (error) {
      console.error("Error al compartir:", error);
      Alert.alert("Error", "No se pudo compartir la promoción");
    }
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);

    // Solo actualizar si el índice realmente cambió y es válido
    if (
      index !== currentIndex &&
      index >= 0 &&
      index < promociones.length &&
      isMountedRef.current
    ) {
      setCurrentIndex(index);

      // Registrar vista de la nueva promoción visible (de forma asíncrona)
      if (promociones[index]) {
        // Usar setTimeout para no bloquear el render durante el scroll
        setTimeout(() => {
          if (isMountedRef.current) {
            registrarVistaPromocion(promociones[index].id);
          }
        }, 100);
      }
    }
  };

  // Log del estado actual en cada render
  console.log("🎁 PromocionesScreen render:", {
    loading,
    promocionesCount: promociones.length,
    error,
    hasLoaded: hasLoadedRef.current,
    tipoUsuario,
  });

  if (loading) {
    console.log("🎁 Mostrando pantalla de carga");
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando promociones...</Text>
        </View>
      </View>
    );
  }

  if (promociones.length === 0) {
    console.log("🎁 No hay promociones, mostrando pantalla vacía", { error });
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎁</Text>
          {error ? (
            <>
              <Text style={styles.emptyText}>
                Error al cargar promociones
              </Text>
              <Text style={styles.emptySubtext}>
                {error}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadPromociones(true)}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.emptyText}>
                No hay promociones especiales disponibles en este momento
              </Text>
              <Text style={styles.emptySubtext}>
                Vuelve más tarde para descubrir nuevas ofertas
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadPromociones(true)}
              >
                <Text style={styles.retryButtonText}>Actualizar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        removeClippedSubviews={true}
        initialScrollIndex={0}
      >
        {promociones.map((promocion, index) => {
          const imageUrl = promocion.imagen_mobile_url || promocion.imagen_url;

          return (
            <View
              key={`promocion-${promocion.id}`}
              style={styles.slideContainer}
            >
              {/* Imagen de la promoción */}
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.promocionImage}
                  resizeMode="cover"
                  fadeDuration={0}
                  onLoadStart={() => {
                    // Evitar parpadeos durante la carga
                  }}
                  onLoad={() => {
                    // Imagen cargada exitosamente
                  }}
                  onError={() => {
                    console.error(
                      "Error al cargar imagen de promoción:",
                      imageUrl
                    );
                  }}
                />
              ) : (
                <View style={[styles.promocionImage, styles.imagePlaceholder]}>
                  <Text style={styles.placeholderText}>Sin imagen</Text>
                </View>
              )}

              {/* Botones flotantes */}
              {promocion.whatsapp && (
                <TouchableOpacity
                  style={[
                    styles.floatingButton,
                    styles.whatsappButton,
                    styles.leftButton,
                  ]}
                  onPress={() => handleWhatsApp(promocion)}
                >
                  <Text style={styles.floatingButtonText}>Quiero mi promo</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.floatingButton,
                  styles.shareButton,
                  styles.rightButton,
                ]}
                onPress={() => handleShare(promocion)}
              >
                <Text style={styles.floatingButtonText}>Compartir</Text>
              </TouchableOpacity>

              {/* Indicadores de paginación */}
              {promociones.length > 1 && (
                <View style={styles.indicatorContainer}>
                  {promociones.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.indicator,
                        idx === currentIndex && styles.indicatorActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignSelf: "center",
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height:
      SCREEN_HEIGHT *
      (Platform.OS === "android"
        ? 0.7372 // Android: reducido 8% total (0.76 * 0.97 = 0.7372)
        : Platform.OS === "ios"
        ? 0.722 // iOS: reducido 10% total (0.76 * 0.95 = 0.722)
        : 0.76), // Otros: reducido 5% (80% * 0.95 = 76%)
    position: "relative",
  },
  promocionImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.backgroundSecondary,
  },
  imagePlaceholder: {
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  hidden: {
    opacity: 0,
  },
  floatingButton: {
    position: "absolute",
    bottom: 150, // Bajado 30px desde 180
    width: SCREEN_WIDTH * 0.21, // 21% del ancho de pantalla (aumentado 5% desde 20%)
    height: 60, // Alto fijo para ambos botones
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 10,
  },
  leftButton: {
    left: 20,
  },
  rightButton: {
    right: 20,
  },
  floatingButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
  },
  whatsappButton: {
    backgroundColor: "#25D366", // Color de WhatsApp
  },
  shareButton: {
    backgroundColor: colors.primary,
  },
  indicatorContainer: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  indicatorActive: {
    backgroundColor: colors.white,
    width: 24,
  },
});

// Memoizar el componente para evitar re-renders innecesarios
console.log("🎁 ===== EXPORTANDO PromocionesScreen =====");
export const PromocionesScreen = React.memo(PromocionesScreenComponent, (prevProps, nextProps) => {
  // Permitir re-renders para asegurar que se ejecuten los efectos
  return false; // Siempre re-renderizar para debugging
});
