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
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null); // Intervalo para actualizar promociones periódicamente
  const lastRefreshTimeRef = useRef<number>(0); // Timestamp de la última actualización

  // Cargar promociones solo una vez al montar el componente
  useEffect(() => {
    console.log("🎁 ===== useEffect EJECUTADO =====");
    console.log("🎁 hasLoadedRef.current:", hasLoadedRef.current);
    console.log("🎁 isMountedRef.current:", isMountedRef.current);
    console.log("🎁 loading state inicial:", loading);
    console.log("🎁 promociones.length:", promociones.length);
    
    isMountedRef.current = true;
    
    // Si ya se cargó exitosamente y hay promociones, no recargar
    if (hasLoadedRef.current && !loading && promociones.length > 0) {
      console.log("🎁 ✅ Ya hay promociones cargadas, no recargar");
      return () => {
        isMountedRef.current = false;
      };
    }
    
    // Si ya se intentó cargar pero sigue cargando, verificar si está colgada
    // Si lleva más de 6 segundos desde que se montó el componente, forzar nueva carga
    if (hasLoadedRef.current && loading) {
      console.log("🎁 ⚠️ Ya se intentó cargar antes y sigue cargando, verificando si está colgada...");
      
      // Si lleva más de 6 segundos cargando, resetear y volver a intentar
      const hangCheck = setTimeout(() => {
        if (isMountedRef.current) {
          console.error("🎁 ❌ Carga colgada detectada después de 6s, reseteando y reintentando...");
          hasLoadedRef.current = false;
          setLoading(false);
          // Reintentar inmediatamente
          setTimeout(() => {
            if (isMountedRef.current) {
              console.log("🎁 🔄 Reintentando carga de promociones...");
              loadPromociones(true).catch((err) => {
                console.error("🎁 ❌ Error en reintento:", err);
                setError(err instanceof Error ? err.message : "Error al cargar promociones");
              });
            }
          }, 100);
        }
      }, 6000);
      
      return () => {
        clearTimeout(hangCheck);
        isMountedRef.current = false;
      };
    }
    
    // Si ya intentó cargar y no hay promociones pero no está cargando, fue un error
    if (hasLoadedRef.current && !loading && promociones.length === 0) {
      console.log("🎁 ⚠️ Ya se intentó cargar antes pero no hay promociones, no recargar automáticamente");
      return () => {
        isMountedRef.current = false;
      };
    }
    
    // Primera carga - ejecutar loadPromociones
    console.log("🎁 ✅ Llamando a loadPromociones() por primera vez...");
    console.log("🎁 ANTES de marcar hasLoadedRef.current = true");
    hasLoadedRef.current = true; // Marcar como intentado ANTES de llamar
    console.log("🎁 DESPUÉS de marcar hasLoadedRef.current = true");
    console.log("🎁 hasLoadedRef.current ahora es:", hasLoadedRef.current);
    
    // Llamar loadPromociones SIN await para no bloquear
    console.log("🎁 ANTES de llamar loadPromociones(false)");
    const loadResult = loadPromociones(false);
    console.log("🎁 DESPUÉS de llamar loadPromociones(false), resultado:", loadResult);
    
    loadResult.catch((err) => {
      console.error("🎁 ❌ Error capturado en useEffect catch:", err);
      hasLoadedRef.current = false; // Permitir reintento
      if (isMountedRef.current) {
        setLoading(false);
        setError(err instanceof Error ? err.message : "Error al cargar promociones");
      }
    });

    return () => {
      isMountedRef.current = false;
      // Limpiar intervalos al desmontar
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []); // Sin dependencias - solo ejecutar una vez al montar

  // Configurar actualización periódica de promociones (cada 5 minutos)
  useEffect(() => {
    const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos en milisegundos
    
    console.log("🎁 Configurando actualización periódica de promociones cada 5 minutos...");
    
    refreshIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && hasLoadedRef.current && !loading) {
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
        
        // Solo recargar si ha pasado al menos 4 minutos (evitar sobrecarga)
        const MIN_INTERVAL = 4 * 60 * 1000; // 4 minutos mínimo
        
        if (timeSinceLastRefresh >= MIN_INTERVAL) {
          console.log("🎁 ⏰ Actualización periódica: recargando promociones...");
          loadPromociones(true).catch((err) => {
            console.error("🎁 ❌ Error en actualización periódica:", err);
          });
        } else {
          console.log(`🎁 ⏰ Actualización periódica: omitiendo (pasaron solo ${Math.round(timeSinceLastRefresh / 1000)} segundos)`);
        }
      } else {
        if (!isMountedRef.current) {
          console.log("🎁 ⏰ Actualización periódica: componente desmontado, omitiendo");
        } else if (!hasLoadedRef.current) {
          console.log("🎁 ⏰ Actualización periódica: aún no se ha cargado, omitiendo");
        } else if (loading) {
          console.log("🎁 ⏰ Actualización periódica: ya está cargando, omitiendo");
        }
      }
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
        console.log("🎁 ⏰ Intervalo de actualización periódica limpiado");
      }
    };
  }, [loading]); // Depender de loading para verificar el estado actual

  // Recargar promociones cuando se enfoca la pantalla (para obtener nuevas promociones activadas)
  useFocusEffect(
    useCallback(() => {
      console.log("🎁 useFocusEffect ejecutado - verificando si recargar promociones...");
      
      // Solo recargar si:
      // 1. Ya se cargó al menos una vez (hasLoadedRef.current === true)
      // 2. No está cargando actualmente
      // 3. Ha pasado al menos 30 segundos desde la última actualización (evitar recargas excesivas)
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
      const MIN_REFRESH_INTERVAL = 30000; // 30 segundos mínimo entre recargas por focus
      
      if (
        hasLoadedRef.current &&
        !loading &&
        timeSinceLastRefresh >= MIN_REFRESH_INTERVAL
      ) {
        console.log("🎁 Recargando promociones al enfocar (pasaron", Math.round(timeSinceLastRefresh / 1000), "segundos)");
        loadPromociones(true).catch((err) => {
          console.error("🎁 Error al recargar promociones en focus:", err);
        });
      } else {
        if (!hasLoadedRef.current) {
          console.log("🎁 Aún no se ha cargado por primera vez, esperando...");
        } else if (loading) {
          console.log("🎁 Ya está cargando, omitiendo recarga por focus");
        } else {
          console.log("🎁 Muy pronto para recargar (pasaron solo", Math.round(timeSinceLastRefresh / 1000), "segundos)");
        }
      }
      
      return () => {
        // NO limpiar el intervalo al desenfocar
      };
    }, [loading]) // Depender de loading para verificar el estado actual
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
    const functionId = Math.random().toString(36).substring(7);
    console.log(`🎁 ===== loadPromociones INICIADO [${functionId}] =====`);
    console.log(`🎁 Parámetros [${functionId}]:`, { forceReload, loading, hasLoaded: hasLoadedRef.current });
    
    const startTime = Date.now();
    const MAX_TOTAL_TIME = 10000; // 10 segundos máximo total (aumentado para dar más tiempo)

    // Timeout global absoluto - garantiza que siempre termine
    let globalTimeout: NodeJS.Timeout | null = setTimeout(() => {
      console.error(`⏱️ TIMEOUT GLOBAL [${functionId}] alcanzado (10s), forzando finalización`);
      if (isMountedRef.current) {
        promocionesRef.current = [];
        setPromociones([]);
        setLoading(false);
        setError("Timeout al cargar promociones. Intenta nuevamente.");
        hasLoadedRef.current = false; // Permitir reintento
      }
    }, MAX_TOTAL_TIME);

    try {
      console.log(`🔄 [${functionId}] setLoading(true) ejecutado`);
      setLoading(true);
      setError(null); // Limpiar errores previos
      console.log(`🔄 [${functionId}] Iniciando carga de promociones...`, { forceReload, startTime });
      
      // Resetear flag si es recarga forzada
      if (forceReload) {
        hasLoadedRef.current = false;
      }

      // Declarar variables al inicio
      let promocionesActivas: Promocion[] = [];
      let tipo: "cliente" | "prestador" | "ambos" | null = null;

      // PASO 1: Obtener tipo de usuario (rápido, con timeout)
      console.log(`🔄 [${functionId}] Paso 1: Obteniendo usuario...`);
      try {
        const userResult = await withTimeout(getCurrentUser(), 2000, "Timeout usuario");
        if (userResult?.user) {
          tipo = userResult.user.tipo_usuario || null;
          setTipoUsuario(tipo);
          console.log(`👤 [${functionId}] Tipo de usuario detectado: ${tipo}`);
        } else {
          console.log(`👤 [${functionId}] No hay usuario autenticado, cargando promociones generales`);
          tipo = null;
        }
      } catch (userError) {
        console.log(`⚠️ [${functionId}] Error obteniendo usuario, continuando sin tipo:`, userError);
        tipo = null;
      }

      // PASO 2: Ir DIRECTAMENTE a promociones globales (sin verificar permisos primero)
      // Esto evita que se quede bloqueado esperando permisos
      console.log(`🔄 [${functionId}] Paso 2: Cargando promociones globales (sin verificar permisos primero)...`);
      setLocationPermissionGranted(false); // Asumir sin permisos por ahora
      
      try {
        const globalPromise = getPromocionesActivas(tipo);
        const timeElapsed = Date.now() - startTime;
        const timeRemaining = Math.max(5000, MAX_TOTAL_TIME - timeElapsed - 2000); // Al menos 5 segundos

        console.log(`⏱️ [${functionId}] Tiempo restante para promociones globales: ${timeRemaining}ms`);
        promocionesActivas = await withTimeout(
          globalPromise,
          timeRemaining,
          "Timeout cargando promociones globales"
        );
        console.log(`✅ [${functionId}] Promociones globales cargadas: ${promocionesActivas.length}`);
        
        // Si hay promociones, usarlas. Si no, intentar con ubicación (opcional)
        if (promocionesActivas.length > 0) {
          console.log(`✅ [${functionId}] Usando ${promocionesActivas.length} promociones globales`);
        } else {
          // Si no hay promociones globales, intentar con ubicación (opcional, en background)
          console.log(`⚠️ [${functionId}] No hay promociones globales, intentando con ubicación...`);
          
          try {
            const permissionsResult = await withTimeout(
              Location.requestForegroundPermissionsAsync(),
              2000,
              "Timeout permisos"
            );
            
            if (permissionsResult?.status === "granted") {
              setLocationPermissionGranted(true);
              console.log(`📍 [${functionId}] Permisos concedidos, obteniendo ubicación...`);
              
              try {
                const location = await withTimeout(
                  Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Low,
                    maximumAge: 120000,
                    timeout: 2000,
                  }),
                  3000,
                  "Timeout ubicación"
                );
                
                const { latitude, longitude } = location.coords;
                console.log(`📍 [${functionId}] Ubicación obtenida: ${latitude}, ${longitude}`);
                
                // Intentar promociones por proximidad con el tiempo restante
                const remainingTime = Math.max(2000, MAX_TOTAL_TIME - (Date.now() - startTime) - 1000);
                const promocionesPromise = getPromocionesActivasPorProximidad(
                  latitude,
                  longitude,
                  tipo,
                  null,
                  50
                );
                
                promocionesActivas = await withTimeout(
                  promocionesPromise,
                  remainingTime,
                  "Timeout promociones por proximidad"
                );
                console.log(`✅ [${functionId}] Promociones por proximidad cargadas: ${promocionesActivas.length}`);
              } catch (locationError) {
                console.log(`⚠️ [${functionId}] Error obteniendo ubicación:`, locationError);
              }
            }
          } catch (permError) {
            console.log(`⚠️ [${functionId}] Error obteniendo permisos:`, permError);
          }
        }
      } catch (globalError) {
        console.error(`❌ [${functionId}] Error cargando promociones globales:`, globalError);
        promocionesActivas = [];
      }

      // Cancelar timeout global si terminamos exitosamente
      if (globalTimeout) {
        clearTimeout(globalTimeout);
        globalTimeout = null;
      }

      const elapsedTime = Date.now() - startTime;
      console.log(
        `⏱️ [${functionId}] Promociones cargadas en ${elapsedTime}ms. Total: ${promocionesActivas.length}`
      );
      console.log(`🎁 [${functionId}] Promociones cargadas:`, promocionesActivas.slice(0, 3).map(p => ({ id: p.id, titulo: p.titulo })));

      // Solo actualizar estado si el componente está montado
      if (isMountedRef.current) {
        promocionesRef.current = promocionesActivas; // Actualizar referencia primero
        console.log(`🎁 [${functionId}] Actualizando estado con ${promocionesActivas.length} promociones`);
        lastRefreshTimeRef.current = Date.now(); // Actualizar timestamp de última actualización
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
      // Cancelar timeout global
      if (globalTimeout) {
        clearTimeout(globalTimeout);
        globalTimeout = null;
      }
      
      console.error(`🎁 ===== ERROR EN loadPromociones [${functionId}] =====`);
      console.error(`Error [${functionId}]:`, error);
      console.error(`Tipo de error [${functionId}]:`, typeof error);
      console.error(`Error es Error? [${functionId}]:`, error instanceof Error);
      const elapsedTime = Date.now() - startTime;
      console.error(`⏱️ [${functionId}] Error después de ${elapsedTime}ms`);
      if (error?.message) {
        console.error(`Mensaje [${functionId}]:`, error.message);
      }
      if (error?.stack) {
        console.error(`Stack [${functionId}]:`, error.stack);
      }

      if (isMountedRef.current) {
        const errorMessage = error?.message || "Error desconocido al cargar promociones";
        console.error(`🎁 [${functionId}] Estableciendo error:`, errorMessage);
        setError(errorMessage);
        hasLoadedRef.current = false; // Permitir reintento
        
        // Siempre mostrar array vacío si hay error
        promocionesRef.current = [];
        setPromociones([]);
        console.log(`⏱️ [${functionId}] Error procesado, mostrando estado vacío`);
      }
    } finally {
      // SIEMPRE cancelar timeout y asegurar que loading se ponga en false
      if (globalTimeout) {
        clearTimeout(globalTimeout);
        globalTimeout = null;
      }
      
      console.log(`🎁 ===== FINALLY EJECUTADO [${functionId}] =====`);
      console.log(`🎁 [${functionId}] isMountedRef.current:`, isMountedRef.current);
      
      if (isMountedRef.current) {
        console.log(`🎁 [${functionId}] setLoading(false) ejecutado`);
        setLoading(false);
        const totalTime = Date.now() - startTime;
        console.log(`✅ [${functionId}] Carga de promociones completada en ${totalTime}ms`);
        console.log(`🎁 [${functionId}] Estado final:`, { 
          loading: false, 
          promocionesCount: promocionesRef.current.length,
          error 
        });
      } else {
        console.log(`🎁 [${functionId}] ⚠️ Componente desmontado, no actualizando estado`);
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
