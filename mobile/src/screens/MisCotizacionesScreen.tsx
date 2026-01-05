import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { supabase } from "../services/supabaseClient";
import { colors } from "../constants/colors";
import { getCurrentUserId } from "../services/authService";
import { RootStackParamList } from "../types/navigation";
import { openWhatsApp } from "../utils/whatsappUtils";
import { openPhoneCall } from "../utils/phoneUtils";

type MisCotizacionesNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MisCotizaciones"
>;

interface Cotizacion {
  id: number;
  precio_ofrecido: number;
  tiempo_estimado: number;
  descripcion_trabajo: string | null;
  estado: string;
  created_at: string;
  solicitud: {
    id: number;
    descripcion_problema: string | null;
    servicio: {
      nombre: string;
    };
    cliente: {
      nombre: string;
      apellido: string;
      foto_perfil_url: string | null;
      telefono: string;
    };
  };
}

export const MisCotizacionesScreen: React.FC = () => {
  const navigation = useNavigation<MisCotizacionesNavigationProp>();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "pendientes" | "aceptadas" | "rechazadas"
  >("pendientes");

  useEffect(() => {
    loadCotizaciones();
  }, []);

  // Recargar cotizaciones cuando se vuelve a la pantalla
  useFocusEffect(
    useCallback(() => {
      loadCotizaciones();
    }, [])
  );

  const loadCotizaciones = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      if (!userId) return;

      // Obtener el ID del prestador
      const { data: prestadorData, error: prestadorError } = await supabase
        .from("prestadores")
        .select("id")
        .eq("usuario_id", userId)
        .single();

      if (prestadorError || !prestadorData) {
        Alert.alert("Error", "No se encontró perfil de prestador");
        return;
      }

      // Obtener todas las cotizaciones del prestador con datos relacionados
      const { data, error } = await supabase
        .from("cotizaciones")
        .select(
          `
          id,
          precio_ofrecido,
          tiempo_estimado,
          descripcion_trabajo,
          estado,
          created_at,
          solicitudes_servicio (
            id,
            descripcion_problema,
            servicios (nombre),
            cliente:users!solicitudes_servicio_cliente_id_fkey (
              nombre,
              apellido,
              foto_perfil_url,
              telefono
            )
          )
        `
        )
        .eq("prestador_id", prestadorData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData: Cotizacion[] = (data || []).map((c: any) => ({
        id: c.id,
        precio_ofrecido: c.precio_ofrecido,
        tiempo_estimado: c.tiempo_estimado,
        descripcion_trabajo: c.descripcion_trabajo,
        estado: c.estado,
        created_at: c.created_at,
        solicitud: {
          id: c.solicitudes_servicio.id,
          descripcion_problema: c.solicitudes_servicio.descripcion_problema,
          servicio: {
            nombre: c.solicitudes_servicio.servicios?.nombre || "Servicio",
          },
          cliente: c.solicitudes_servicio.cliente,
        },
      }));

      setCotizaciones(formattedData);

      // Verificar si hay notificaciones nuevas de cotizaciones aceptadas
      const cotizacionesAceptadasIds = formattedData
        .filter((c) => c.estado === "aceptada")
        .map((c) => c.id);

      if (cotizacionesAceptadasIds.length > 0) {
        // Verificar si hay notificaciones no leídas antes de marcarlas
        const { data: nuevasNotificaciones } = await supabase
          .from("notificaciones")
          .select("id")
          .eq("usuario_id", userId)
          .eq("tipo", "sistema")
          .eq("leida", false)
          .in("referencia_id", cotizacionesAceptadasIds);

        // Si hay notificaciones nuevas, cambiar a la solapa de aceptadas
        if (nuevasNotificaciones && nuevasNotificaciones.length > 0) {
          setActiveTab("aceptadas");
        }

        // Marcar notificaciones de cotización aceptada como leídas
        await supabase
          .from("notificaciones")
          .update({ leida: true })
          .eq("usuario_id", userId)
          .eq("tipo", "sistema")
          .in("referencia_id", cotizacionesAceptadasIds);
      }
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error);
      Alert.alert("Error", "No se pudieron cargar tus presupuestos");
    } finally {
      setLoading(false);
    }
  };

  const handleLlamar = async (telefono: string, nombre: string) => {
    await openPhoneCall(telefono, nombre);
  };

  const handleWhatsApp = async (telefono: string, nombre: string) => {
    if (!telefono || !telefono.trim()) {
      Alert.alert(
        "Error",
        `No se puede contactar a ${nombre} porque no tiene un número de teléfono registrado.`
      );
      return;
    }
    const mensaje = `Hola ${nombre}, te contacto respecto al presupuesto que aceptaste.`;
    await openWhatsApp(telefono, mensaje, nombre);
  };

  // Filtrar cotizaciones según la solapa activa
  const cotizacionesFiltradas = cotizaciones.filter((cotiz) => {
    if (activeTab === "pendientes") {
      return cotiz.estado !== "aceptada" && cotiz.estado !== "rechazada";
    } else if (activeTab === "aceptadas") {
      return cotiz.estado === "aceptada";
    } else {
      return cotiz.estado === "rechazada";
    }
  });

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
        {cotizacionesFiltradas.length === 0 ? (
          <Text style={styles.emptyText}>
            {activeTab === "pendientes"
              ? "No tienes presupuestos pendientes."
              : activeTab === "aceptadas"
              ? "No tienes presupuestos aceptados."
              : "No tienes presupuestos rechazados."}
          </Text>
        ) : (
          cotizacionesFiltradas.map((cotiz) => (
            <View key={cotiz.id} style={styles.cotizacionCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.servicioNombre}>
                  {cotiz.solicitud.servicio.nombre}
                </Text>
                <View
                  style={[
                    styles.estadoBadge,
                    {
                      backgroundColor:
                        cotiz.estado === "aceptada"
                          ? colors.success + "20"
                          : cotiz.estado === "rechazada"
                          ? colors.error + "20"
                          : colors.warning + "20",
                      borderColor:
                        cotiz.estado === "aceptada"
                          ? colors.success
                          : cotiz.estado === "rechazada"
                          ? colors.error
                          : colors.warning,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.estadoBadgeText,
                      {
                        color:
                          cotiz.estado === "aceptada"
                            ? colors.success
                            : cotiz.estado === "rechazada"
                            ? colors.error
                            : colors.warning,
                      },
                    ]}
                  >
                    {cotiz.estado === "aceptada"
                      ? "✓ Aceptada"
                      : cotiz.estado === "rechazada"
                      ? "✕ Rechazada"
                      : "⏳ Pendiente"}
                  </Text>
                </View>
              </View>

              {/* Información del cliente */}
              <View style={styles.clienteRow}>
                {cotiz.solicitud.cliente.foto_perfil_url ? (
                  <Image
                    source={{ uri: cotiz.solicitud.cliente.foto_perfil_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {cotiz.solicitud.cliente.nombre[0]}
                    </Text>
                  </View>
                )}
                <View style={styles.clienteInfo}>
                  <Text style={styles.clienteLabel}>Cliente</Text>
                  <Text style={styles.clienteNombre}>
                    {cotiz.solicitud.cliente.nombre}{" "}
                    {cotiz.solicitud.cliente.apellido}
                  </Text>
                  {cotiz.solicitud.cliente.telefono && (
                    <Text style={styles.telefonoText}>
                      📞 {cotiz.solicitud.cliente.telefono}
                    </Text>
                  )}
                </View>
              </View>

              {/* Descripción del trabajo solicitado */}
              {cotiz.solicitud.descripcion_problema && (
                <View style={styles.descripcionContainer}>
                  <Text style={styles.descripcionLabel}>
                    Descripción del trabajo:
                  </Text>
                  <Text style={styles.descripcionText}>
                    {cotiz.solicitud.descripcion_problema}
                  </Text>
                </View>
              )}

              {/* Detalles de la cotización */}
              <View style={styles.detallesContainer}>
                <View style={styles.detalleRow}>
                  <Text style={styles.detalleLabel}>Precio ofrecido:</Text>
                  <Text style={styles.detalleValue}>
                    ${cotiz.precio_ofrecido}
                  </Text>
                </View>
                <View style={styles.detalleRow}>
                  <Text style={styles.detalleLabel}>Tiempo estimado:</Text>
                  <Text style={styles.detalleValue}>
                    {cotiz.tiempo_estimado} horas
                  </Text>
                </View>
                {cotiz.descripcion_trabajo && (
                  <View style={styles.detalleRow}>
                    <Text style={styles.detalleLabel}>Tu propuesta:</Text>
                    <Text style={styles.detalleValue}>
                      {cotiz.descripcion_trabajo}
                    </Text>
                  </View>
                )}
                <View style={styles.detalleRow}>
                  <Text style={styles.detalleLabel}>Fecha de envío:</Text>
                  <Text style={styles.detalleValue}>
                    {new Date(cotiz.created_at).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>

              {/* Botones de acción */}
              {cotiz.estado === "aceptada" &&
                cotiz.solicitud.cliente.telefono && (
                  <View style={styles.comunicacionContainer}>
                    <Text style={styles.comunicacionTitle}>
                      ¡Presupuesto aceptado! Contacta al cliente:
                    </Text>
                    <View style={styles.comunicacionButtons}>
                      <TouchableOpacity
                        style={styles.btnLlamar}
                        onPress={() =>
                          handleLlamar(
                            cotiz.solicitud.cliente.telefono,
                            `${cotiz.solicitud.cliente.nombre} ${cotiz.solicitud.cliente.apellido}`
                          )
                        }
                      >
                        <Text style={styles.btnComunicacionText}>
                          📞 Llamar
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnWhatsApp}
                        onPress={() =>
                          handleWhatsApp(
                            cotiz.solicitud.cliente.telefono,
                            cotiz.solicitud.cliente.nombre
                          )
                        }
                      >
                        <Text style={styles.btnComunicacionText}>
                          💬 WhatsApp
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnVerTrabajo}
                        onPress={() => navigation.navigate("MisTrabajos")}
                      >
                        <Text style={styles.btnComunicacionText}>
                          Ver Trabajo
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
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
    fontSize: 14,
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
    fontSize: 16,
  },
  cotizacionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  servicioNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  estadoBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  clienteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: colors.backgroundSecondary,
    padding: 12,
    borderRadius: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "bold",
  },
  clienteInfo: {
    flex: 1,
  },
  clienteLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  clienteNombre: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  telefonoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  descripcionContainer: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
  },
  descripcionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  descripcionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  detallesContainer: {
    marginBottom: 15,
  },
  detalleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detalleLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  detalleValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    textAlign: "right",
  },
  comunicacionContainer: {
    backgroundColor: colors.success + "10",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.success + "30",
  },
  comunicacionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
  },
  comunicacionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  btnLlamar: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnWhatsApp: {
    flex: 1,
    backgroundColor: "#25D366",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnVerTrabajo: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnComunicacionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
});
