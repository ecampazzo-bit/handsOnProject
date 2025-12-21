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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { supabase } from "../services/supabaseClient";
import { colors } from "../constants/colors";
import { getCurrentUserId } from "../services/authService";
import { RootStackParamList } from "../types/navigation";
import {
  aceptarCotizacion,
  rechazarCotizacion,
} from "../services/solicitudService";

type MisPresupuestosNavigationProp = StackNavigationProp<
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
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "pendientes" | "aceptadas" | "rechazadas"
  >("pendientes");

  useEffect(() => {
    loadDatos();
  }, []);

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
              users_public(nombre, apellido, foto_perfil_url, telefono)
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
                "Presupuesto aceptado. El profesional ha sido notificado."
              );
              loadDatos();
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

  const handleContactar = (telefono: string) => {
    Alert.alert(
      "Contactar prestador",
      `El teléfono del prestador es: ${telefono}`
    );
    // Aquí podrías usar Linking para abrir WhatsApp o llamar
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
            <View key={solicitud.id} style={styles.solicitudCard}>
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
                      <View>
                        <Text style={styles.prestadorNombre}>
                          {cotiz.prestador.usuario.nombre}{" "}
                          {cotiz.prestador.usuario.apellido}
                        </Text>
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
                        <View style={styles.estadoAceptadoContainer}>
                          <Text style={styles.estadoAceptadoText}>
                            Esta cotización fue aceptada
                          </Text>
                        </View>
                      ) : cotiz.estado === "rechazada" ? (
                        <View style={styles.estadoRechazadoContainer}>
                          <Text style={styles.estadoRechazadoText}>
                            Esta cotización fue desestimada
                          </Text>
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.btnRechazar}
                            onPress={() => handleRechazar(cotiz.id)}
                          >
                            <Text style={styles.btnTextRechazar}>
                              No interesa
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
                          <TouchableOpacity
                            style={styles.btnContactar}
                            onPress={() =>
                              handleContactar(cotiz.prestador.usuario.telefono)
                            }
                          >
                            <Text style={styles.btnTextContactar}>📞</Text>
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
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
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
  prestadorNombre: { fontWeight: "bold", fontSize: 15 },
  precioText: { color: colors.success, fontWeight: "600" },
  cotizDesc: { fontSize: 14, color: colors.textSecondary, marginBottom: 15 },
  actions: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  btnRechazar: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: "center",
    flex: 2,
  },
  btnAceptar: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: colors.success,
    alignItems: "center",
    flex: 2,
  },
  btnContactar: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    flex: 1,
  },
  btnTextRechazar: { color: colors.error, fontWeight: "600" },
  btnTextAceptar: { color: colors.white, fontWeight: "600" },
  btnTextContactar: { color: colors.white, fontWeight: "600" },
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
