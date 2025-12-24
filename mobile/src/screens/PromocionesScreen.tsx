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
import {
  getPromocionesActivas,
  registrarVistaPromocion,
  registrarClickPromocion,
  Promocion,
} from "../services/promocionService";
import { getCurrentUser } from "../services/authService";
import { colors } from "../constants/colors";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CAROUSEL_INTERVAL = 7000; // 7 segundos

export const PromocionesScreen: React.FC = () => {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tipoUsuario, setTipoUsuario] = useState<
    "cliente" | "prestador" | "ambos" | null
  >(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadPromociones();
      return () => {
        // Limpiar intervalo al desmontar o cambiar de pantalla
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [])
  );

  useEffect(() => {
    // Configurar carrusel automático cuando hay promociones
    if (promociones.length > 1) {
      startCarousel();
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [promociones.length, currentIndex]);

  const loadPromociones = async () => {
    try {
      setLoading(true);
      // Obtener tipo de usuario
      const { user } = await getCurrentUser();
      const tipo = user?.tipo_usuario || null;
      setTipoUsuario(tipo as "cliente" | "prestador" | "ambos" | null);

      // Cargar promociones activas
      const promocionesActivas = await getPromocionesActivas(
        tipo as "cliente" | "prestador" | "ambos" | null
      );
      setPromociones(promocionesActivas);
      setCurrentIndex(0);

      // Registrar vista de la primera promoción
      if (promocionesActivas.length > 0) {
        registrarVistaPromocion(promocionesActivas[0].id);
      }
    } catch (error) {
      console.error("Error al cargar promociones:", error);
      Alert.alert("Error", "No se pudieron cargar las promociones");
    } finally {
      setLoading(false);
    }
  };

  const startCarousel = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % promociones.length;
        // Scroll al siguiente índice
        scrollViewRef.current?.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: true,
        });
        // Registrar vista de la nueva promoción
        if (promociones[nextIndex]) {
          registrarVistaPromocion(promociones[nextIndex].id);
        }
        return nextIndex;
      });
    }, CAROUSEL_INTERVAL);
  };

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
      const numero = promocion.whatsapp.replace(/[^0-9+]/g, ""); // Limpiar formato
      const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

      // Intentar abrir WhatsApp
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          "No se pudo abrir WhatsApp. Verifica que esté instalado en tu dispositivo."
        );
      }
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
    
    if (index !== currentIndex && index >= 0 && index < promociones.length) {
      setCurrentIndex(index);
      // Registrar vista de la nueva promoción visible
      if (promociones[index]) {
        registrarVistaPromocion(promociones[index].id);
      }
    }
  };

  if (loading) {
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
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎁</Text>
          <Text style={styles.emptyText}>
            No hay promociones especiales disponibles en este momento
          </Text>
          <Text style={styles.emptySubtext}>
            Vuelve más tarde para descubrir nuevas ofertas
          </Text>
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
      >
        {promociones.map((promocion, index) => (
          <View key={promocion.id} style={styles.slideContainer}>
            {/* Imagen de la promoción */}
            <Image
              source={{
                uri: promocion.imagen_mobile_url || promocion.imagen_url || "",
              }}
              style={styles.promocionImage}
              resizeMode="cover"
            />

            {/* Botones flotantes */}
            {promocion.whatsapp && (
              <TouchableOpacity
                style={[styles.floatingButton, styles.whatsappButton, styles.leftButton]}
                onPress={() => handleWhatsApp(promocion)}
              >
                <Text style={styles.floatingButtonText}>Quiero mi promo</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.floatingButton, styles.shareButton, styles.rightButton]}
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
        ))}
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
  slideContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * (
      Platform.OS === 'android' ? 0.7372 : // Android: reducido 8% total (0.76 * 0.97 = 0.7372)
      Platform.OS === 'ios' ? 0.722 : // iOS: reducido 10% total (0.76 * 0.95 = 0.722)
      0.76 // Otros: reducido 5% (80% * 0.95 = 76%)
    ),
    position: "relative",
  },
  promocionImage: {
    width: "100%",
    height: "100%",
  },
  floatingButton: {
    position: "absolute",
    bottom: 150, // Bajado 30px desde 180
    width: SCREEN_WIDTH * 0.20, // 20% del ancho de pantalla
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

