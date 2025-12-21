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
  RefreshControl,
  Modal,
  TextInput,
  Linking,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { supabase } from "../services/supabaseClient";
import { colors } from "../constants/colors";
import { getCurrentUserId, getCurrentUser } from "../services/authService";
import { RootStackParamList, User } from "../types/navigation";
import { finalizarTrabajo } from "../services/solicitudService";
import { createCalificacion } from "../services/ratingService";

type MisTrabajosNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MisTrabajos"
>;

interface Trabajo {
  id: number;
  estado: string;
  monto_final: number;
  created_at: string;
  prestador_id: number;
  cliente_id: string;
  ya_calificado?: boolean;
  es_cliente?: boolean; // Si el usuario actual es el cliente en este trabajo
  es_prestador?: boolean; // Si el usuario actual es el prestador en este trabajo
  solicitud: {
    servicio: { nombre: string };
    descripcion: string | null;
  };
  otro_usuario: {
    id: string;
    nombre: string;
    apellido: string;
    foto_perfil_url: string | null;
    telefono: string;
  };
}

export const MisTrabajosScreen: React.FC = () => {
  const navigation = useNavigation<MisTrabajosNavigationProp>();
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  // Tabs para distinguir entre rol de prestador y cliente
  const [activeRoleTab, setActiveRoleTab] = useState<
    "prestador" | "cliente" | null
  >(null);
  const [puedeSerPrestadorYCliente, setPuedeSerPrestadorYCliente] =
    useState(false);
  const [activeTab, setActiveTab] = useState<"en_curso" | "terminados">(
    "en_curso"
  );

  // Estados para el modal de calificación
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { user: userData } = await getCurrentUser();
      setUser(userData);

      // Obtener el prestador_id del usuario si existe (necesario para las consultas)
      const { data: prestadorData } = await supabase
        .from("prestadores")
        .select("id")
        .eq("usuario_id", userId)
        .single();

      const prestadorId = prestadorData?.id;

      // Determinar si el usuario puede ser prestador y cliente usando el campo tipo_usuario
      const puedeSerAmbos = userData?.tipo_usuario === "ambos";
      setPuedeSerPrestadorYCliente(puedeSerAmbos);
      console.log("🔍 Debug MisTrabajos:", {
        puedeSerAmbos,
        tipo_usuario: userData?.tipo_usuario,
        prestadorId,
      });

      // Establecer el tab inicial según el rol del usuario
      if (puedeSerAmbos) {
        // Si puede ser ambos, establecer el tab inicial según tenga trabajos
        // Verificar si tiene trabajos como prestador o cliente para establecer el tab inicial
        if (prestadorId) {
          const { data: trabajosData } = await supabase
            .from("trabajos")
            .select("prestador_id, cliente_id")
            .or(`cliente_id.eq.${userId},prestador_id.eq.${prestadorId}`)
            .limit(1);

          if (trabajosData && trabajosData.length > 0) {
            const primerTrabajo = trabajosData[0];
            const esClienteEnPrimerTrabajo =
              primerTrabajo.cliente_id === userId;
            setActiveRoleTab(
              esClienteEnPrimerTrabajo ? "cliente" : "prestador"
            );
          } else {
            // Si no hay trabajos, establecer por defecto como cliente
            setActiveRoleTab("cliente");
          }
        } else {
          // Si no tiene prestadorId pero tipo_usuario es "ambos", establecer como cliente
          setActiveRoleTab("cliente");
        }
      } else {
        // Si solo puede ser uno, establecer según su tipo
        if (userData?.tipo_usuario === "cliente") {
          setActiveRoleTab("cliente");
        } else if (userData?.tipo_usuario === "prestador" || prestadorId) {
          setActiveRoleTab("prestador");
        } else {
          // Fallback
          setActiveRoleTab("cliente");
        }
      }

      // Consulta compleja para obtener trabajos donde el usuario es cliente O prestador
      let query = supabase.from("trabajos").select(`
          id,
          estado,
          monto_final,
          created_at,
          prestador_id,
          cliente_id,
          solicitudes_servicio (
            descripcion_problema,
            servicios (nombre)
          ),
          cliente:users!trabajos_cliente_id_fkey (id, nombre, apellido, foto_perfil_url, telefono),
          prestador:prestadores (
            id,
            users_public (id, nombre, apellido, foto_perfil_url, telefono)
          ),
          calificaciones(id, calificador_id, tipo_calificacion)
        `);

      // Obtener trabajos donde el usuario es cliente O prestador
      if (prestadorId) {
        // Usuario puede ser cliente o prestador - buscar ambos casos
        query = query.or(
          `cliente_id.eq.${userId},prestador_id.eq.${prestadorId}`
        );
      } else {
        // Si no es prestador, solo buscar como cliente
        query = query.eq("cliente_id", userId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      const formatted: Trabajo[] = (data || []).map((t: any) => {
        // Determinar el rol del usuario en este trabajo específico
        const esClienteEnEsteTrabajo = t.cliente_id === userId;
        const esPrestadorEnEsteTrabajo =
          prestadorId && t.prestador_id === prestadorId;

        // Determinar el otro usuario según el rol en este trabajo
        const otroUsuario = esClienteEnEsteTrabajo
          ? t.prestador?.users_public
          : esPrestadorEnEsteTrabajo
          ? t.cliente
          : null;

        // Verificar si el usuario actual ya calificó este trabajo
        const tipoCalificacionEsperado = esClienteEnEsteTrabajo
          ? "cliente_a_prestador"
          : esPrestadorEnEsteTrabajo
          ? "prestador_a_cliente"
          : null;

        const yaCalificado =
          tipoCalificacionEsperado &&
          (t.calificaciones || []).some(
            (cal: any) =>
              cal.calificador_id === userId &&
              cal.tipo_calificacion === tipoCalificacionEsperado
          )
            ? true
            : false;

        return {
          id: t.id,
          estado: t.estado,
          monto_final: t.monto_final,
          created_at: t.created_at,
          prestador_id: t.prestador_id,
          cliente_id: t.cliente_id,
          ya_calificado: yaCalificado,
          es_cliente: esClienteEnEsteTrabajo, // Agregar flag para saber el rol en este trabajo
          es_prestador: esPrestadorEnEsteTrabajo, // Agregar flag para saber el rol en este trabajo
          solicitud: {
            servicio: t.solicitudes_servicio?.servicios,
            descripcion: t.solicitudes_servicio?.descripcion_problema,
          },
          otro_usuario: {
            id: otroUsuario?.id || "",
            nombre: otroUsuario?.nombre || "Usuario",
            apellido: otroUsuario?.apellido || "",
            foto_perfil_url: otroUsuario?.foto_perfil_url,
            telefono: otroUsuario?.telefono || "",
          },
        };
      });

      setTrabajos(formatted);
    } catch (error) {
      console.error("Error al cargar trabajos:", error);
      Alert.alert("Error", "No se pudieron cargar los trabajos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleFinalizar = async (trabajoId: number) => {
    Alert.alert(
      "Finalizar Trabajo",
      "¿Estás seguro de que has completado este servicio? El cliente será notificado para calificar.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, finalizar",
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await finalizarTrabajo(trabajoId);
              if (error) throw error;
              Alert.alert("Éxito", "Trabajo marcado como finalizado.");
              loadData();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "No se pudo finalizar el trabajo"
              );
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleFinalizarComoCliente = async (trabajoId: number) => {
    Alert.alert(
      "Marcar como Finalizado",
      "¿El prestador ha completado el trabajo? Podrás calificarlo después.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, finalizar",
          onPress: async () => {
            try {
              setLoading(true);
              // Actualizar el estado del trabajo a completado
              const { error } = await supabase
                .from("trabajos")
                .update({
                  estado: "completado",
                  fecha_fin: new Date().toISOString(),
                })
                .eq("id", trabajoId);

              if (error) throw error;

              // Notificar al prestador para que califique al cliente
              const trabajo = trabajos.find((t) => t.id === trabajoId);
              if (trabajo) {
                // Obtener información del servicio para la notificación
                const { data: trabajoData } = await supabase
                  .from("trabajos")
                  .select("solicitudes_servicio(servicios(nombre))")
                  .eq("id", trabajoId)
                  .single();

                const servicioNombre =
                  (trabajoData?.solicitudes_servicio as any)?.servicios
                    ?.nombre || "servicio";

                await supabase.from("notificaciones").insert({
                  usuario_id: trabajo.otro_usuario.id,
                  tipo: "calificacion",
                  titulo: "Califica a tu cliente",
                  contenido: `El cliente ha marcado como finalizado el trabajo de ${servicioNombre}. Califica tu experiencia con ${trabajo.otro_usuario.nombre} ${trabajo.otro_usuario.apellido} en "Mis Trabajos".`,
                  referencia_id: trabajoId,
                  referencia_tipo: "trabajo",
                  leida: false,
                });
              }

              // Cambiar a la solapa de terminados
              setActiveTab("terminados");

              // Recargar datos
              await loadData();

              // Buscar el trabajo actualizado para ofrecer calificar
              const { data: trabajoActualizado } = await supabase
                .from("trabajos")
                .select(
                  `
                  id,
                  calificaciones(id)
                `
                )
                .eq("id", trabajoId)
                .single();

              const yaCalificado =
                trabajoActualizado?.calificaciones &&
                trabajoActualizado.calificaciones.length > 0;

              if (!yaCalificado) {
                // Guardar el trabajo para poder calificarlo después
                const trabajoParaCalificar = trabajo;

                Alert.alert(
                  "Trabajo Finalizado",
                  "¿Deseas calificar el servicio ahora?",
                  [
                    {
                      text: "Después",
                      style: "cancel",
                    },
                    {
                      text: "Calificar ahora",
                      onPress: () => {
                        // Usar el trabajo que guardamos antes de recargar
                        if (trabajoParaCalificar) {
                          // Actualizar el estado del trabajo para reflejar que está completado
                          const trabajoActualizado: Trabajo = {
                            ...trabajoParaCalificar,
                            estado: "completado",
                          };
                          openRatingModal(trabajoActualizado);
                        }
                      },
                    },
                  ]
                );
              } else {
                Alert.alert("Éxito", "Trabajo marcado como finalizado.");
              }
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "No se pudo finalizar el trabajo"
              );
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openRatingModal = (trabajo: Trabajo) => {
    setSelectedTrabajo(trabajo);
    setRating(5);
    setComentario("");
    setShowRatingModal(true);
  };

  const handleSendRating = async () => {
    if (!selectedTrabajo) return;

    setRatingLoading(true);
    try {
      // Determinar el tipo de calificación según el rol del usuario en este trabajo específico
      const tipoCalificacion = selectedTrabajo.es_cliente
        ? "cliente_a_prestador"
        : selectedTrabajo.es_prestador
        ? "prestador_a_cliente"
        : null;

      if (!tipoCalificacion) {
        throw new Error("No se pudo determinar el tipo de calificación");
      }

      const { error } = await createCalificacion({
        trabajoId: selectedTrabajo.id,
        calificadoId: selectedTrabajo.otro_usuario.id,
        tipoCalificacion: tipoCalificacion,
        puntuacion: rating,
        comentario: comentario,
      });

      if (error) throw error;

      Alert.alert("Gracias", "Tu calificación ha sido enviada correctamente.");
      setShowRatingModal(false);
      loadData();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo enviar la calificación"
      );
    } finally {
      setRatingLoading(false);
    }
  };

  const handleLlamar = async (telefono: string, nombre: string) => {
    try {
      const phoneNumber = telefono.replace(/[^0-9+]/g, ""); // Limpiar formato
      const url = `tel:${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Error",
          `No se puede realizar la llamada. Teléfono: ${telefono}`
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir la aplicación de llamadas");
    }
  };

  const handleWhatsApp = async (telefono: string, nombre: string) => {
    try {
      // Limpiar y formatear número de teléfono
      let phoneNumber = telefono.replace(/[^0-9+]/g, "");

      // Si no empieza con +, agregar código de país (Argentina por defecto)
      if (!phoneNumber.startsWith("+")) {
        // Asumir que es Argentina si no tiene código de país
        phoneNumber = `+54${phoneNumber}`;
      }

      const message = `Hola ${nombre}, te contacto respecto al trabajo que aceptaste.`;
      const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
        message
      )}`;

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "WhatsApp no disponible",
          "Por favor instala WhatsApp o usa el número: " + telefono
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo abrir WhatsApp");
    }
  };

  const getEstadoLabel = (estado: string) => {
    const map: any = {
      programado: "Programado",
      en_camino: "En Camino",
      en_progreso: "En Progreso",
      completado: "Finalizado",
      cancelado: "Cancelado",
    };
    return map[estado] || estado;
  };

  // Filtrar trabajos según el rol activo y el estado
  const trabajosFiltrados = trabajos.filter((trabajo) => {
    // Primero filtrar por rol (prestador o cliente)
    if (puedeSerPrestadorYCliente && activeRoleTab) {
      if (activeRoleTab === "prestador" && !trabajo.es_prestador) {
        return false;
      }
      if (activeRoleTab === "cliente" && !trabajo.es_cliente) {
        return false;
      }
    }

    // Luego filtrar por estado (en curso o terminados)
    if (activeTab === "en_curso") {
      // Trabajos que no están completados ni cancelados
      return trabajo.estado !== "completado" && trabajo.estado !== "cancelado";
    } else {
      // Trabajos completados
      return trabajo.estado === "completado";
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
        <Text style={styles.title}>Mis Trabajos</Text>
      </View>

      {/* Tabs de rol (prestador/cliente) - solo si puede ser ambos */}
      {puedeSerPrestadorYCliente && activeRoleTab && (
        <View style={styles.roleSectionContainer}>
          <Text style={styles.roleSectionTitle}>Ver trabajos:</Text>
          <View style={styles.roleTabsContainer}>
            <TouchableOpacity
              style={[
                styles.roleTab,
                activeRoleTab === "prestador" && styles.roleTabActivePrestador,
              ]}
              onPress={() => {
                setActiveRoleTab("prestador");
                setActiveTab("en_curso"); // Resetear a en curso al cambiar de rol
              }}
            >
              <Text
                style={[
                  styles.roleTabText,
                  activeRoleTab === "prestador" &&
                    styles.roleTabTextActivePrestador,
                ]}
              >
                🔧 Trabajos Realizados
              </Text>
              <Text style={styles.roleTabSubtext}>Como prestador</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleTab,
                activeRoleTab === "cliente" && styles.roleTabActiveCliente,
              ]}
              onPress={() => {
                setActiveRoleTab("cliente");
                setActiveTab("en_curso"); // Resetear a en curso al cambiar de rol
              }}
            >
              <Text
                style={[
                  styles.roleTabText,
                  activeRoleTab === "cliente" &&
                    styles.roleTabTextActiveCliente,
                ]}
              >
                👤 Trabajos Solicitados
              </Text>
              <Text style={styles.roleTabSubtext}>Como cliente</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tabs de estado (en curso/terminados) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "en_curso" && styles.tabActive]}
          onPress={() => setActiveTab("en_curso")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "en_curso" && styles.tabTextActive,
            ]}
          >
            🔄 En Curso
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "terminados" && styles.tabActive]}
          onPress={() => setActiveTab("terminados")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "terminados" && styles.tabTextActive,
            ]}
          >
            ✅ Terminados
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {trabajosFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {puedeSerPrestadorYCliente && activeRoleTab
                ? activeRoleTab === "prestador"
                  ? activeTab === "en_curso"
                    ? "No tienes trabajos en curso como prestador."
                    : "No tienes trabajos terminados como prestador."
                  : activeTab === "en_curso"
                  ? "No tienes trabajos en curso como cliente."
                  : "No tienes trabajos terminados como cliente."
                : activeTab === "en_curso"
                ? "No tienes trabajos en curso."
                : "No tienes trabajos terminados."}
            </Text>
          </View>
        ) : (
          trabajosFiltrados.map((trabajo) => (
            <TouchableOpacity key={trabajo.id} style={styles.card}>
              {/* Badge de rol - solo si puede ser ambos */}
              {puedeSerPrestadorYCliente && (
                <View
                  style={[
                    styles.roleBadge,
                    trabajo.es_prestador
                      ? styles.roleBadgePrestador
                      : styles.roleBadgeCliente,
                  ]}
                >
                  <Text style={styles.roleBadgeText}>
                    {trabajo.es_prestador
                      ? "🔧 Trabajo Realizado"
                      : "👤 Trabajo Solicitado"}
                  </Text>
                </View>
              )}

              <View style={styles.cardHeader}>
                <Text style={styles.servicioNombre}>
                  {trabajo.solicitud.servicio?.nombre}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        trabajo.estado === "completado"
                          ? colors.success
                          : colors.warning,
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getEstadoLabel(trabajo.estado)}
                  </Text>
                </View>
              </View>

              <View style={styles.userRow}>
                {trabajo.otro_usuario.foto_perfil_url ? (
                  <Image
                    source={{ uri: trabajo.otro_usuario.foto_perfil_url }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {trabajo.otro_usuario.nombre[0]}
                    </Text>
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={styles.userLabel}>
                    {trabajo.es_cliente
                      ? "Prestador"
                      : trabajo.es_prestador
                      ? "Cliente"
                      : "Usuario"}
                  </Text>
                  <Text style={styles.userName}>
                    {trabajo.otro_usuario.nombre}{" "}
                    {trabajo.otro_usuario.apellido}
                  </Text>
                  {trabajo.otro_usuario.telefono && (
                    <Text style={styles.telefonoText}>
                      📞 {trabajo.otro_usuario.telefono}
                    </Text>
                  )}
                </View>
              </View>

              {/* Botones de comunicación - especialmente importante para prestadores */}
              {trabajo.es_prestador &&
                trabajo.estado !== "completado" &&
                trabajo.otro_usuario.telefono && (
                  <View style={styles.comunicacionContainer}>
                    <Text style={styles.comunicacionTitle}>
                      Contactar al cliente:
                    </Text>
                    <View style={styles.comunicacionButtons}>
                      <TouchableOpacity
                        style={styles.btnLlamar}
                        onPress={() =>
                          handleLlamar(
                            trabajo.otro_usuario.telefono,
                            `${trabajo.otro_usuario.nombre} ${trabajo.otro_usuario.apellido}`
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
                            trabajo.otro_usuario.telefono,
                            trabajo.otro_usuario.nombre
                          )
                        }
                      >
                        <Text style={styles.btnComunicacionText}>
                          💬 WhatsApp
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

              {/* Botones de comunicación para clientes también */}
              {user?.tipo_usuario === "cliente" &&
                trabajo.otro_usuario.telefono && (
                  <View style={styles.comunicacionContainer}>
                    <View style={styles.comunicacionButtons}>
                      <TouchableOpacity
                        style={styles.btnLlamar}
                        onPress={() =>
                          handleLlamar(
                            trabajo.otro_usuario.telefono,
                            `${trabajo.otro_usuario.nombre} ${trabajo.otro_usuario.apellido}`
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
                            trabajo.otro_usuario.telefono,
                            trabajo.otro_usuario.nombre
                          )
                        }
                      >
                        <Text style={styles.btnComunicacionText}>
                          💬 WhatsApp
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

              {trabajo.solicitud.descripcion && (
                <Text style={styles.descripcion} numberOfLines={2}>
                  {trabajo.solicitud.descripcion}
                </Text>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.fecha}>
                  {new Date(trabajo.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.monto}>Total: ${trabajo.monto_final}</Text>
              </View>

              {/* Botones de acción */}
              <View style={styles.actionButtons}>
                {/* Botón de finalizar para prestadores */}
                {trabajo.es_prestador && trabajo.estado !== "completado" && (
                  <TouchableOpacity
                    style={styles.btnFinalizar}
                    onPress={() => handleFinalizar(trabajo.id)}
                  >
                    <Text style={styles.btnTextWhite}>
                      Marcar como Finalizado
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Botón de finalizar para clientes (trabajos en curso) */}
                {trabajo.es_cliente &&
                  trabajo.estado !== "completado" &&
                  trabajo.estado !== "cancelado" && (
                    <TouchableOpacity
                      style={styles.btnFinalizar}
                      onPress={() => handleFinalizarComoCliente(trabajo.id)}
                    >
                      <Text style={styles.btnTextWhite}>
                        Marcar como Finalizado
                      </Text>
                    </TouchableOpacity>
                  )}

                {/* Botón de calificar para clientes (trabajos terminados) */}
                {trabajo.es_cliente &&
                  trabajo.estado === "completado" &&
                  !trabajo.ya_calificado && (
                    <TouchableOpacity
                      style={styles.btnCalificar}
                      onPress={() => openRatingModal(trabajo)}
                    >
                      <Text style={styles.btnTextWhite}>
                        Calificar Servicio
                      </Text>
                    </TouchableOpacity>
                  )}

                {/* Botón de calificar para prestadores (trabajos terminados) */}
                {trabajo.es_prestador &&
                  trabajo.estado === "completado" &&
                  !trabajo.ya_calificado && (
                    <TouchableOpacity
                      style={styles.btnCalificar}
                      onPress={() => openRatingModal(trabajo)}
                    >
                      <Text style={styles.btnTextWhite}>Calificar Cliente</Text>
                    </TouchableOpacity>
                  )}

                {/* Badge de ya calificado */}
                {trabajo.ya_calificado && (
                  <View style={styles.calificadoBadge}>
                    <Text style={styles.calificadoText}>Ya calificado ⭐</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal de Calificación */}
      <Modal visible={showRatingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedTrabajo?.es_cliente
                ? "Calificar Servicio"
                : selectedTrabajo?.es_prestador
                ? "Calificar Cliente"
                : "Calificar"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedTrabajo?.es_cliente
                ? `¿Qué tal fue tu experiencia con ${selectedTrabajo?.otro_usuario.nombre} ${selectedTrabajo?.otro_usuario.apellido}?`
                : selectedTrabajo?.es_prestador
                ? `¿Cómo fue tu experiencia trabajando con ${selectedTrabajo?.otro_usuario.nombre} ${selectedTrabajo?.otro_usuario.apellido}?`
                : `¿Cómo fue tu experiencia con ${selectedTrabajo?.otro_usuario.nombre} ${selectedTrabajo?.otro_usuario.apellido}?`}
            </Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Text
                    style={[
                      styles.star,
                      { color: s <= rating ? colors.warning : colors.border },
                    ]}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.ratingInput}
              placeholder="Deja un comentario (opcional)..."
              multiline
              numberOfLines={4}
              value={comentario}
              onChangeText={setComentario}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowRatingModal(false)}
              >
                <Text style={styles.btnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSend, ratingLoading && { opacity: 0.7 }]}
                onPress={handleSendRating}
                disabled={ratingLoading}
              >
                {ratingLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.btnTextWhite}>Enviar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  roleSectionContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  roleSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  roleTabsContainer: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 4,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  roleTabActivePrestador: {
    backgroundColor: "#E3F2FD", // Azul claro para prestador
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  roleTabActiveCliente: {
    backgroundColor: "#F3E5F5", // Morado claro para cliente
    borderWidth: 1,
    borderColor: "#9C27B0",
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 2,
  },
  roleTabTextActivePrestador: {
    color: "#1976D2", // Azul para prestador activo
  },
  roleTabTextActiveCliente: {
    color: "#7B1FA2", // Morado para cliente activo
  },
  roleTabSubtext: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  roleBadgePrestador: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#2196F3",
  },
  roleBadgeCliente: {
    backgroundColor: "#F3E5F5",
    borderWidth: 1,
    borderColor: "#9C27B0",
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
  },
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
  emptyState: { marginTop: 50, alignItems: "center" },
  emptyText: { color: colors.textSecondary, textAlign: "center" },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  servicioNombre: { fontSize: 18, fontWeight: "bold", color: colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: colors.white, fontSize: 12, fontWeight: "bold" },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: colors.backgroundSecondary,
    padding: 10,
    borderRadius: 8,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: colors.white, fontWeight: "bold" },
  userInfo: { flex: 1 },
  userLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  userName: { fontSize: 15, fontWeight: "600", color: colors.text },
  telefonoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  comunicacionContainer: {
    backgroundColor: colors.primary + "10",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary + "30",
  },
  comunicacionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
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
    backgroundColor: "#25D366", // Color verde de WhatsApp
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnComunicacionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  callButton: {
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descripcion: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 15,
    fontStyle: "italic",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 12,
    marginBottom: 12,
  },
  fecha: { fontSize: 13, color: colors.textLight },
  monto: { fontSize: 15, fontWeight: "bold", color: colors.primary },

  actionButtons: { marginTop: 5 },
  btnFinalizar: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnCalificar: {
    backgroundColor: colors.warning,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnTextWhite: { color: colors.white, fontWeight: "bold", fontSize: 15 },
  calificadoBadge: { alignItems: "center", paddingVertical: 8 },
  calificadoText: { color: colors.textSecondary, fontStyle: "italic" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  star: { fontSize: 40 },
  ratingInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSend: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 8,
  },
  btnTextCancel: { color: colors.textSecondary, fontWeight: "600" },
});
