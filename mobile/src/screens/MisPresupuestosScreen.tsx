import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { supabase } from "../services/supabaseClient";
import { colors } from "../constants/colors";
import { getCurrentUserId } from "../services/authService";
import { RootStackParamList } from "../types/navigation";
import {
  aceptarCotizacion,
  rechazarCotizacion,
} from "../services/solicitudService";

// Componente para mostrar estrellas de calificación
const StarRating: React.FC<{ rating: number; size?: number }> = ({
  rating,
  size = 14,
}) => {
  const normalizedRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {[...Array(fullStars)].map((_, i) => (
        <Text key={`full-${i}`} style={{ fontSize: size }}>
          ⭐
        </Text>
      ))}
      {hasHalfStar && <Text style={{ fontSize: size }}>⭐</Text>}
      {[...Array(emptyStars)].map((_, i) => (
        <Text key={`empty-${i}`} style={{ fontSize: size, opacity: 0.3 }}>
          ⭐
        </Text>
      ))}
    </View>
  );
};

type MisPresupuestosNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MisPresupuestos"
>;

type MisPresupuestosRouteProp = RouteProp<
  RootStackParamList,
  "MisPresupuestos"
>;

interface Cotizacion {
  id: number;
  precio_ofrecido: number;
  tiempo_estimado: number;
  descripcion_trabajo: string | null;
  estado: string;
  prestador: {
    id: number;
    usuario: {
      nombre: string;
      apellido: string;
      foto_perfil_url: string | null;
      telefono: string;
      calificacion_promedio: number | null;
      cantidad_calificaciones: number;
    };
  };
}

interface Solicitud {
  id: number;
  servicio_nombre: string;
  descripcion_problema: string | null;
  estado: string;
  created_at: string;
  cotizaciones: Cotizacion[];
}

export const MisPresupuestosScreen: React.FC = () => {
  const navigation = useNavigation<MisPresupuestosNavigationProp>();
  const route = useRoute<MisPresupuestosRouteProp>();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "pendientes" | "aceptadas" | "rechazadas"
  >(route.params?.tab || "pendientes");
  const [highlightedSolicitudId, setHighlightedSolicitudId] = useState<
    number | null
  >(route.params?.solicitudId || null);

  useEffect(() => {
    loadDatos();
  }, []);

  // Si hay parámetros de navegación, ajustar el tab y resaltar la solicitud
  useEffect(() => {
    if (route.params?.tab) {
      setActiveTab(route.params.tab);
    }
    if (route.params?.solicitudId) {
      setHighlightedSolicitudId(route.params.solicitudId);
    }
  }, [route.params]);

  const loadDatos = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      if (!userId) return;

      // Verificar y marcar notificaciones de cotización como leídas
      const { data: notificacionesAntes, error: notifCheckError } =
        await supabase
          .from("notificaciones")
          .select("id, tipo, referencia_id")
          .eq("usuario_id", userId)
          .eq("tipo", "nueva_cotizacion")
          .eq("leida", false);

      console.log(
        `Notificaciones de cotización no leídas para cliente ${userId}:`,
        notificacionesAntes?.length || 0
      );
      if (notificacionesAntes && notificacionesAntes.length > 0) {
        console.log(
          "Notificaciones:",
          JSON.stringify(notificacionesAntes, null, 2)
        );
      }

      // Marcar notificaciones de cotización como leídas
      const { error: updateError } = await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("usuario_id", userId)
        .eq("tipo", "nueva_cotizacion")
        .eq("leida", false);

      if (updateError) {
        console.error(
          "Error al marcar notificaciones como leídas:",
          updateError
        );
      }

      // Obtener solicitudes del cliente con sus servicios y cotizaciones
      const { data, error } = await supabase
        .from("solicitudes_servicio")
        .select(
          `
          id,
          descripcion_problema,
          estado,
          created_at,
          servicios(nombre),
          cotizaciones(
            id,
            precio_ofrecido,
            tiempo_estimado,
            descripcion_trabajo,
            estado,
            prestadores(
              id,
              users_public(nombre, apellido, foto_perfil_url, telefono, calificacion_promedio, cantidad_calificaciones)
            )
          )
        `
        )
        .eq("cliente_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData: Solicitud[] = (data || []).map((s: any) => ({
        id: s.id,
        servicio_nombre: s.servicios?.nombre || "Servicio",
        descripcion_problema: s.descripcion_problema,
        estado: s.estado,
        created_at: s.created_at,
        cotizaciones: (s.cotizaciones || []).map((c: any) => ({
          id: c.id,
          precio_ofrecido: c.precio_ofrecido,
          tiempo_estimado: c.tiempo_estimado,
          descripcion_trabajo: c.descripcion_trabajo,
          estado: c.estado,
          prestador: {
            id: c.prestadores.id,
            usuario: c.prestadores.users_public,
          },
        })),
      }));

      setSolicitudes(formattedData);
    } catch (error) {
      console.error("Error al cargar presupuestos:", error);
      Alert.alert("Error", "No se pudieron cargar tus presupuestos");
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async (cotizacionId: number) => {
    Alert.alert(
      "Rechazar presupuesto",
      "¿Estás seguro de que no te interesa esta oferta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, rechazar",
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await rechazarCotizacion(cotizacionId);
              if (error) throw error;

              Alert.alert("Éxito", "Presupuesto rechazado.");
              loadDatos();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "No se pudo rechazar el presupuesto"
              );
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAceptar = async (cotizacionId: number, solicitudId: number) => {
    Alert.alert(
      "Aceptar presupuesto",
      "¿Estás seguro de que quieres elegir este profesional? Se desestimarán las demás ofertas.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, aceptar",
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await aceptarCotizacion(
                cotizacionId,
                solicitudId
              );
              if (error) throw error;

              Alert.alert(
                "¡Éxito!",
                "Presupuesto aceptado. El profesional ha sido notificado.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      // Cambiar a la pestaña "aceptadas" y recargar datos
                      setActiveTab("aceptadas");
                      loadDatos();
                    },
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "No se pudo aceptar el presupuesto"
              );
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLlamar = async (telefono: string, nombre: string) => {
    try {
      const url = `tel:${telefono}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "No se puede llamar",
          `Por favor llama manualmente a ${nombre}: ${telefono}`
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo realizar la llamada");
    }
  };

  const handleWhatsApp = async (telefono: string, nombre: string) => {
    try {
      // Limpiar el número de teléfono (quitar espacios, guiones, etc.)
      const cleanPhone = telefono.replace(/[^0-9]/g, "");
      const url = `whatsapp://send?phone=${cleanPhone}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "WhatsApp no disponible",
          `Por favor instala WhatsApp o usa el número: ${telefono}`
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir WhatsApp");
    }
  };

  const handleVerTrabajo = (solicitudId: number) => {
    navigation.navigate("MisTrabajos");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: 100 }}
        />
      </View>
    );
  }

  // Filtrar solicitudes según la solapa activa
  const solicitudesFiltradas = solicitudes
    .map((solicitud) => ({
      ...solicitud,
      cotizaciones: solicitud.cotizaciones.filter((cotiz) => {
        if (activeTab === "pendientes") {
          // Mostrar cotizaciones que no están aceptadas ni rechazadas
          return cotiz.estado !== "aceptada" && cotiz.estado !== "rechazada";
        } else if (activeTab === "aceptadas") {
          return cotiz.estado === "aceptada";
        } else {
          return cotiz.estado === "rechazada";
        }
      }),
    }))
    .filter((solicitud) => solicitud.cotizaciones.length > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis Presupuestos</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pendientes" && styles.tabActive]}
          onPress={() => setActiveTab("pendientes")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pendientes" && styles.tabTextActive,
            ]}
          >
            ⏳ Pendientes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "aceptadas" && styles.tabActive]}
          onPress={() => setActiveTab("aceptadas")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "aceptadas" && styles.tabTextActive,
            ]}
          >
            ✓ Aceptadas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "rechazadas" && styles.tabActive]}
          onPress={() => setActiveTab("rechazadas")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "rechazadas" && styles.tabTextActive,
            ]}
          >
            ✕ Rechazadas
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {solicitudesFiltradas.length === 0 ? (
          <Text style={styles.emptyText}>
            {activeTab === "pendientes"
              ? "No tienes cotizaciones pendientes."
              : activeTab === "aceptadas"
              ? "No tienes cotizaciones aceptadas."
              : "No tienes cotizaciones rechazadas."}
          </Text>
        ) : (
          solicitudesFiltradas.map((solicitud) => (
            <View
              key={solicitud.id}
              style={[
                styles.solicitudCard,
                highlightedSolicitudId === solicitud.id &&
                  styles.solicitudCardHighlighted,
              ]}
            >
              <View style={styles.solicitudInfo}>
                <Text style={styles.servicioNombre}>
                  {solicitud.servicio_nombre}
                </Text>
                <Text style={styles.estadoTag}>
                  {solicitud.estado.toUpperCase()}
                </Text>
              </View>

              {solicitud.cotizaciones.length === 0 ? (
                <Text style={styles.noCotizaciones}>
                  Esperando ofertas de prestadores...
                </Text>
              ) : (
                solicitud.cotizaciones.map((cotiz) => (
                  <View key={cotiz.id} style={styles.cotizacionCard}>
                    <View style={styles.prestadorRow}>
                      {cotiz.prestador.usuario.foto_perfil_url ? (
                        <Image
                          source={{
                            uri: cotiz.prestador.usuario.foto_perfil_url,
                          }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {cotiz.prestador.usuario.nombre[0]}
                          </Text>
                        </View>
                      )}
                      <View style={styles.prestadorInfo}>
                        <Text style={styles.prestadorNombre}>
                          {cotiz.prestador.usuario.nombre}{" "}
                          {cotiz.prestador.usuario.apellido}
                        </Text>
                        {cotiz.prestador.usuario.calificacion_promedio !==
                          null &&
                        cotiz.prestador.usuario.cantidad_calificaciones > 0 ? (
                          <View style={styles.ratingContainer}>
                            <StarRating
                              rating={
                                cotiz.prestador.usuario.calificacion_promedio
                              }
                              size={12}
                            />
                            <Text style={styles.ratingText}>
                              {cotiz.prestador.usuario.calificacion_promedio.toFixed(
                                1
                              )}{" "}
                              ({cotiz.prestador.usuario.cantidad_calificaciones}
                              )
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.noRatingText}>
                            Sin calificaciones
                          </Text>
                        )}
                        <Text style={styles.precioText}>
                          ${cotiz.precio_ofrecido} • {cotiz.tiempo_estimado}hs
                          aprox.
                        </Text>
                      </View>
                    </View>

                    {cotiz.descripcion_trabajo && (
                      <Text style={styles.cotizDesc}>
                        {cotiz.descripcion_trabajo}
                      </Text>
                    )}

                    {/* Indicador de estado de la cotización */}
                    {cotiz.estado === "aceptada" && (
                      <View style={styles.estadoBadgeAceptada}>
                        <Text style={styles.estadoBadgeText}>
                          ✓ Cotización aceptada
                        </Text>
                      </View>
                    )}
                    {cotiz.estado === "rechazada" && (
                      <View style={styles.estadoBadgeRechazada}>
                        <Text style={styles.estadoBadgeText}>
                          ✕ Cotización desestimada
                        </Text>
                      </View>
                    )}

                    <View style={styles.actions}>
                      {cotiz.estado === "aceptada" ? (
                        <>
                          <TouchableOpacity
                            style={styles.btnLlamar}
                            onPress={() =>
                              handleLlamar(
                                cotiz.prestador.usuario.telefono,
                                `${cotiz.prestador.usuario.nombre} ${cotiz.prestador.usuario.apellido}`
                              )
                            }
                          >
                            <Text style={styles.btnTextLlamar}>📞 Llamar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.btnWhatsApp}
                            onPress={() =>
                              handleWhatsApp(
                                cotiz.prestador.usuario.telefono,
                                `${cotiz.prestador.usuario.nombre} ${cotiz.prestador.usuario.apellido}`
                              )
                            }
                          >
                            <Text style={styles.btnTextWhatsApp}>
                              💬 WhatsApp
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.btnVerTrabajo}
                            onPress={() => handleVerTrabajo(solicitud.id)}
                          >
                            <Text style={styles.btnTextVerTrabajo}>
                              Ver Trabajo
                            </Text>
                          </TouchableOpacity>
                        </>
                      ) : cotiz.estado === "rechazada" ? (
                        <View style={styles.estadoRechazadoContainer}>
                          <Text style={styles.estadoRechazadoText}>
                            Esta cotización fue desestimada
                          </Text>
                        </View>
                      ) : (
                        <>
                          {/* Botones principales: Desestimar y Aceptar */}
                          <TouchableOpacity
                            style={styles.btnRechazar}
                            onPress={() => handleRechazar(cotiz.id)}
                          >
                            <Text style={styles.btnTextRechazar}>
                              Desestimar
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.btnAceptar}
                            onPress={() =>
                              handleAceptar(cotiz.id, solicitud.id)
                            }
                          >
                            <Text style={styles.btnTextAceptar}>Aceptar</Text>
                          </TouchableOpacity>
                          {/* Botones secundarios: Llamar y WhatsApp */}
                          <TouchableOpacity
                            style={styles.btnLlamar}
                            onPress={() =>
                              handleLlamar(
                                cotiz.prestador.usuario.telefono,
                                `${cotiz.prestador.usuario.nombre} ${cotiz.prestador.usuario.apellido}`
                              )
                            }
                          >
                            <Text style={styles.btnTextLlamar}>📞 Llamar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.btnWhatsApp}
                            onPress={() =>
                              handleWhatsApp(
                                cotiz.prestador.usuario.telefono,
                                `${cotiz.prestador.usuario.nombre} ${cotiz.prestador.usuario.apellido}`
                              )
                            }
                          >
                            <Text style={styles.btnTextWhatsApp}>
                              💬 WhatsApp
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "bold", color: colors.text },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  content: { flex: 1, padding: 16 },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: colors.textSecondary,
  },
  solicitudCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  solicitudCardHighlighted: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + "10",
  },
  solicitudInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  servicioNombre: { fontSize: 18, fontWeight: "bold", color: colors.primary },
  estadoTag: { fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  noCotizaciones: { fontStyle: "italic", color: colors.textLight },
  cotizacionCard: {
    marginTop: 10,
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
  },
  prestadorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: { color: colors.white, fontWeight: "bold" },
  prestadorInfo: {
    flex: 1,
  },
  prestadorNombre: { fontWeight: "bold", fontSize: 15, marginBottom: 4 },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  noRatingText: {
    fontSize: 11,
    color: colors.textLight,
    fontStyle: "italic",
    marginBottom: 4,
  },
  precioText: { color: colors.success, fontWeight: "600", fontSize: 13 },
  cotizDesc: { fontSize: 14, color: colors.textSecondary, marginBottom: 15 },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  btnRechazar: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minWidth: "48%",
    height: 36,
  },
  btnAceptar: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minWidth: "48%",
    height: 36,
  },
  btnLlamar: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minWidth: "30%",
    height: 32,
  },
  btnWhatsApp: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: "#25D366", // Color verde de WhatsApp
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minWidth: "30%",
    height: 32,
  },
  btnVerTrabajo: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 4,
  },
  btnTextRechazar: {
    color: colors.error,
    fontWeight: "600",
    fontSize: 12,
  },
  btnTextAceptar: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 12,
  },
  btnTextLlamar: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 12,
  },
  btnTextWhatsApp: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 12,
  },
  btnTextVerTrabajo: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 12,
  },
  estadoBadgeAceptada: {
    backgroundColor: colors.success + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.success,
  },
  estadoBadgeRechazada: {
    backgroundColor: colors.error + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.error,
  },
  estadoBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  estadoAceptadoContainer: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    backgroundColor: colors.success + "20",
    alignItems: "center",
  },
  estadoAceptadoText: {
    color: colors.success,
    fontWeight: "600",
    fontSize: 14,
  },
  estadoRechazadoContainer: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    backgroundColor: colors.error + "20",
    alignItems: "center",
  },
  estadoRechazadoText: {
    color: colors.error,
    fontWeight: "600",
    fontSize: 14,
  },
});
