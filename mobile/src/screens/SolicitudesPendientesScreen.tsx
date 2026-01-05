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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { supabase } from "../services/supabaseClient";
import { colors } from "../constants/colors";
import { getCurrentUserId } from "../services/authService";
import { RootStackParamList } from "../types/navigation";
import { getImageUrl, isValidImageUrl } from "../utils/imageUtils";

type SolicitudesPendientesNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SolicitudesPendientes"
>;

interface Solicitud {
  id: number;
  cliente_id: string;
  servicio_id: number;
  descripcion_problema: string | null;
  direccion: string | null;
  fotos_urls: string[] | null;
  created_at: string;
  estado: string;
  servicio_nombre?: string;
  cliente_nombre?: string;
  cliente_apellido?: string;
  cliente_foto_url?: string;
  ya_cotizado?: boolean; // Indica si este prestador ya cotizó
}

// Componente para mostrar una imagen con manejo de errores
const SolicitudImage: React.FC<{
  foto: string;
  index: number;
  solicitudId: number;
}> = ({ foto, index, solicitudId }) => {
  const [imageError, setImageError] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(true);

  useEffect(() => {
    if (!foto || !isValidImageUrl(foto)) {
      setImageError(true);
      setLoadingImage(false);
      return;
    }

    // Si la URL es de Supabase Storage, intentar obtener URL firmada primero
    // ya que las URLs públicas pueden fallar si el bucket no está configurado como público
    if (foto.includes("supabase.co/storage/v1/object/public/solicitudes/")) {
      setLoadingImage(true);
      getImageUrl(foto)
        .then((url) => {
          if (url && url !== foto) {
            console.log(`✅ URL firmada obtenida: ${url.substring(0, 80)}...`);
            setSignedUrl(url);
            // Usar URL firmada desde el inicio
          } else {
            console.warn(
              `⚠️ No se pudo obtener URL firmada, usando pública: ${foto.substring(
                0,
                80
              )}...`
            );
          }
          setLoadingImage(false);
        })
        .catch((error) => {
          console.error("Error al obtener URL firmada:", error);
          setLoadingImage(false);
          // Continuar con la URL pública original
        });
    } else {
      setLoadingImage(false);
    }
  }, [foto]);

  const handleImageError = useCallback(
    async (error: any) => {
      const errorDetails = error?.nativeEvent?.error || error?.message || error;
      console.error(`❌ Error cargando imagen: ${foto}`);
      console.error("Detalles del error:", errorDetails);
      
      // Verificar si la imagen existe y tiene contenido
      if (foto.includes("supabase.co/storage/v1/object/public/solicitudes/")) {
        try {
          // Extraer el path del archivo de la URL
          const urlParts = foto.split("/solicitudes/");
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            console.log(`🔍 Verificando archivo: ${filePath}`);
            
            // Intentar obtener metadata del archivo
            const pathParts = filePath.split("/");
            const folderPath = pathParts.slice(0, -1).join("/");
            const fileName = pathParts[pathParts.length - 1];
            
            const { data: files, error: listError } = await supabase.storage
              .from("solicitudes")
              .list(folderPath, {
                search: fileName,
              });
            
            if (!listError && files && files.length > 0) {
              const file = files[0];
              const fileSize = file.metadata?.size || 0;
              console.log(`📊 Tamaño del archivo: ${fileSize} bytes`);
              
              if (fileSize === 0 || fileSize === "0") {
                console.error(`❌ El archivo está vacío (0 bytes). Imagen corrupta.`);
                setImageError(true);
                setLoadingImage(false);
                return;
              }
            } else {
              console.warn(`⚠️ No se pudo verificar el archivo:`, listError);
            }
          }
        } catch (verifyError) {
          console.error(`Error al verificar archivo:`, verifyError);
        }
      }

      // Si tenemos una URL firmada diferente a la original y aún falla, mostrar error
      if (signedUrl && signedUrl !== foto) {
        console.error(`❌ La URL firmada también falló: ${signedUrl}`);
        setImageError(true);
        setLoadingImage(false);
        return;
      }

      // Si aún no tenemos URL firmada y la imagen es de Supabase, intentar obtenerla
      if (
        !signedUrl &&
        foto.includes("supabase.co/storage/v1/object/public/solicitudes/")
      ) {
        console.log("🔄 Intentando obtener URL firmada como fallback...");
        const url = await getImageUrl(foto);
        if (url && url !== foto) {
          console.log(
            `✅ URL firmada obtenida como fallback: ${url.substring(0, 50)}...`
          );
          setSignedUrl(url);
          setImageError(false);
          setLoadingImage(true);
          return;
        }
      }

      setImageError(true);
      setLoadingImage(false);
    },
    [foto, signedUrl]
  );

  if (!isValidImageUrl(foto)) {
    return null;
  }

  // Usar URL firmada si está disponible (más confiable), sino usar la original
  const imageUri = signedUrl || foto;

  return (
    <View style={styles.fotoWrapper}>
      {loadingImage && (
        <View style={styles.imageLoadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      {!imageError && imageUri && (
        <Image
          key={signedUrl || foto} // Forzar re-render cuando cambia la URL
          source={{ uri: imageUri }}
          style={styles.foto}
          onLoadStart={() => {
            console.log(
              `Iniciando carga de imagen: ${imageUri.substring(0, 80)}...`
            );
            setLoadingImage(true);
          }}
          onLoad={() => {
            console.log(
              `✅ Foto cargada exitosamente: ${imageUri.substring(0, 80)}...`
            );
            setLoadingImage(false);
            setImageError(false);
          }}
          onError={handleImageError}
          resizeMode="cover"
        />
      )}
      {imageError && (
        <View style={styles.imageErrorContainer}>
          <Text style={styles.imageErrorText}>⚠️</Text>
          <Text style={styles.imageErrorLabel}>Error al cargar</Text>
        </View>
      )}
      <View style={styles.fotoOverlay}>
        <Text style={styles.fotoIndexText}>{index + 1}</Text>
      </View>
    </View>
  );
};

export const SolicitudesPendientesScreen: React.FC = () => {
  const navigation = useNavigation<SolicitudesPendientesNavigationProp>();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSolicitudes();
  }, []);

  const loadSolicitudes = async () => {
    try {
      setLoading(true);
      const prestadorUserId = await getCurrentUserId();
      if (!prestadorUserId) {
        Alert.alert("Error", "No se pudo identificar al usuario");
        return;
      }

      // Obtener notificaciones de nueva_solicitud para este prestador
      const { data: notificaciones, error: notifError } = await supabase
        .from("notificaciones")
        .select("id, referencia_id, referencia_tipo, tipo, leida, created_at")
        .eq("usuario_id", prestadorUserId)
        .eq("tipo", "nueva_solicitud")
        .eq("referencia_tipo", "solicitud_servicio")
        .order("created_at", { ascending: false });

      if (notifError) {
        console.error("Error al obtener notificaciones:", notifError);
        console.error("Detalles:", JSON.stringify(notifError, null, 2));
      }

      console.log(
        `Notificaciones encontradas para prestador ${prestadorUserId}:`,
        notificaciones?.length || 0
      );
      console.log("Notificaciones:", JSON.stringify(notificaciones, null, 2));

      const solicitudIds =
        notificaciones
          ?.map((n) => {
            // Asegurar que referencia_id sea un número válido
            const id =
              typeof n.referencia_id === "number"
                ? n.referencia_id
                : parseInt(String(n.referencia_id || "0"), 10);
            return id > 0 ? id : null;
          })
          .filter((id): id is number => id !== null) || [];

      console.log("IDs de solicitudes extraídos:", solicitudIds);

      // Marcar notificaciones como leídas
      if (notificaciones && notificaciones.length > 0) {
        const notificacionIds = notificaciones.map((n) => n.id);
        await supabase
          .from("notificaciones")
          .update({ leida: true })
          .in("id", notificacionIds);
      }

      if (solicitudIds.length === 0) {
        setSolicitudes([]);
        return;
      }

      // Obtener las solicitudes
      // Mostrar solicitudes pendientes o en cotización (pero no aceptadas)
      // Esto permite que todos los prestadores sigan viendo la solicitud
      // hasta que el cliente acepte una cotización
      const { data: solicitudesData, error: solicitudesError } = await supabase
        .from("solicitudes_servicio")
        .select(
          "id, cliente_id, servicio_id, descripcion_problema, direccion, fotos_urls, created_at, estado"
        )
        .in("id", solicitudIds)
        .in("estado", ["pendiente", "cotizando"])
        .order("created_at", { ascending: false });

      if (solicitudesError) {
        console.error("Error al obtener solicitudes:", solicitudesError);
        Alert.alert("Error", "No se pudieron cargar las solicitudes");
        return;
      }

      // Obtener nombres de servicios y clientes
      const servicioIds = [
        ...new Set(solicitudesData.map((s) => s.servicio_id)),
      ];
      const clienteIds = [...new Set(solicitudesData.map((s) => s.cliente_id))];

      const { data: serviciosData } = await supabase
        .from("servicios")
        .select("id, nombre")
        .in("id", servicioIds);

      const { data: clientesData } = await supabase
        .from("users_public")
        .select("id, nombre, apellido, foto_perfil_url")
        .in("id", clienteIds);

      const serviciosMap = new Map(
        serviciosData?.map((s) => [s.id, s.nombre]) || []
      );
      const clientesMap = new Map(
        clientesData?.map((c) => [
          c.id,
          {
            nombre: c.nombre,
            apellido: c.apellido,
            foto_perfil_url: c.foto_perfil_url,
          },
        ]) || []
      );

      // Obtener el ID del prestador actual para verificar si ya cotizó
      const { data: prestadorData } = await supabase
        .from("prestadores")
        .select("id")
        .eq("usuario_id", prestadorUserId)
        .single();

      const prestadorId = prestadorData?.id;

      // Si hay prestador, verificar qué solicitudes ya tienen cotización de este prestador
      let solicitudesYaCotizadas = new Set<number>();
      if (prestadorId && solicitudIds.length > 0) {
        const { data: cotizacionesData } = await supabase
          .from("cotizaciones")
          .select("solicitud_id")
          .eq("prestador_id", prestadorId)
          .in("solicitud_id", solicitudIds);

        if (cotizacionesData) {
          solicitudesYaCotizadas = new Set(
            cotizacionesData.map((c) => c.solicitud_id)
          );
        }
      }

      const solicitudesConDatos = solicitudesData.map((solicitud) => {
        // Asegurarse de que fotos_urls sea un array si viene como string de Postgres
        let fotosUrlsArr = solicitud.fotos_urls;
        console.log(
          `DEBUG: Solicitud ${solicitud.id} fotos_urls original:`,
          fotosUrlsArr
        );

        if (typeof fotosUrlsArr === "string") {
          try {
            const cleanStr = (fotosUrlsArr as string)
              .replace(/^\{/, "")
              .replace(/\}$/, "");
            if (cleanStr) {
              fotosUrlsArr = cleanStr.split(",").map((item) => {
                return item.trim().replace(/^"/, "").replace(/"$/, "");
              });
            } else {
              fotosUrlsArr = [];
            }
          } catch (e) {
            console.error("Error al parsear fotos_urls:", e);
            fotosUrlsArr = [];
          }
        }

        if (!Array.isArray(fotosUrlsArr)) {
          fotosUrlsArr = [];
        }

        // Limpiar cada URL de posibles comillas o espacios extras
        const SUPABASE_URL = "https://kqxnjpyupcxbajuzsbtx.supabase.co";
        const cleanFotosUrls = fotosUrlsArr
          .filter(
            (url: any) => typeof url === "string" && url.trim().length > 0
          )
          .map((url: any) => {
            let cleanUrl = url.trim().replace(/^"/, "").replace(/"$/, "");
            if (cleanUrl.startsWith("/")) {
              cleanUrl = `${SUPABASE_URL}/storage/v1/object/public/${cleanUrl.replace(
                /^\//,
                ""
              )}`;
            }
            return cleanUrl;
          });

        console.log(
          `DEBUG: Solicitud ${solicitud.id} fotos_urls final:`,
          cleanFotosUrls
        );

        const cliente = clientesMap.get(solicitud.cliente_id);
        let clienteFoto = cliente?.foto_perfil_url;
        if (clienteFoto && clienteFoto.startsWith("/")) {
          clienteFoto = `${SUPABASE_URL}/storage/v1/object/public/${clienteFoto.replace(
            /^\//,
            ""
          )}`;
        }

        return {
          ...solicitud,
          fotos_urls: cleanFotosUrls,
          servicio_nombre: serviciosMap.get(solicitud.servicio_id),
          cliente_nombre: cliente?.nombre,
          cliente_apellido: cliente?.apellido,
          cliente_foto_url: clienteFoto,
          ya_cotizado: solicitudesYaCotizadas.has(solicitud.id),
        };
      });

      console.log(
        "Solicitudes con datos procesadas:",
        JSON.stringify(solicitudesConDatos, null, 2)
      );
      setSolicitudes(solicitudesConDatos);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
      Alert.alert("Error", "Ocurrió un error al cargar las solicitudes");
    } finally {
      setLoading(false);
    }
  };

  const handleDesestimar = async (solicitudId: number) => {
    try {
      const prestadorUserId = await getCurrentUserId();
      if (!prestadorUserId) return;

      // Eliminar la notificación para este prestador y esta solicitud
      const { error } = await supabase
        .from("notificaciones")
        .delete()
        .eq("usuario_id", prestadorUserId)
        .eq("referencia_id", solicitudId)
        .eq("tipo", "nueva_solicitud");

      if (error) throw error;

      // Actualizar estado local
      setSolicitudes(solicitudes.filter((s) => s.id !== solicitudId));
      Alert.alert(
        "Solicitud desestimada",
        "La solicitud ha sido eliminada de tu lista."
      );
    } catch (error) {
      console.error("Error al desestimar:", error);
      Alert.alert("Error", "No se pudo desestimar la solicitud.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Solicitudes de Presupuesto</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitudes de Presupuesto</Text>
      </View>

      {solicitudes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
        >
          {solicitudes.map((solicitud) => (
            <TouchableOpacity
              key={solicitud.id}
              style={styles.solicitudCard}
              onPress={() => {
                navigation.navigate("ResponderSolicitud", {
                  solicitudId: solicitud.id,
                  servicioNombre: solicitud.servicio_nombre || "Servicio",
                });
              }}
            >
              <View style={styles.solicitudHeader}>
                {solicitud.cliente_foto_url ? (
                  <Image
                    source={{ uri: solicitud.cliente_foto_url }}
                    style={styles.clienteFoto}
                    onLoad={() =>
                      console.log(
                        `Foto perfil cargada: ${solicitud.cliente_foto_url}`
                      )
                    }
                    onError={(e) => {
                      console.error(
                        `Error foto perfil ${solicitud.cliente_foto_url}:`,
                        e.nativeEvent.error
                      );
                      // Si falla la carga, podríamos intentar forzar el placeholder
                      // pero por ahora solo logueamos
                    }}
                  />
                ) : (
                  <View style={styles.clienteFotoPlaceholder}>
                    <Text style={styles.clienteFotoPlaceholderText}>
                      {solicitud.cliente_nombre?.charAt(0)}
                    </Text>
                  </View>
                )}
                <View style={styles.solicitudHeaderInfo}>
                  <Text style={styles.servicioNombre}>
                    {solicitud.servicio_nombre || "Servicio"}
                  </Text>
                  <Text style={styles.clienteNombre}>
                    Cliente: {solicitud.cliente_nombre}{" "}
                    {solicitud.cliente_apellido}
                  </Text>
                  <Text style={styles.fecha}>
                    {formatDate(solicitud.created_at)}
                  </Text>
                </View>
              </View>

              {/* Indicadores de estado */}
              <View style={styles.badgesContainer}>
                {solicitud.estado === "cotizando" && (
                  <View style={styles.badgeCotizando}>
                    <Text style={styles.badgeText}>
                      ⚡ Otros prestadores ya cotizaron
                    </Text>
                  </View>
                )}
                {solicitud.ya_cotizado && (
                  <View style={styles.badgeYaCotizado}>
                    <Text style={styles.badgeText}>
                      ✓ Ya enviaste tu cotización
                    </Text>
                  </View>
                )}
              </View>

              {solicitud.descripcion_problema && (
                <Text style={styles.descripcion} numberOfLines={3}>
                  {solicitud.descripcion_problema}
                </Text>
              )}

              {solicitud.fotos_urls && solicitud.fotos_urls.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.fotosContainer}
                >
                  {solicitud.fotos_urls.map((foto, index) => (
                    <SolicitudImage
                      key={`${solicitud.id}-foto-${index}`}
                      foto={foto}
                      index={index}
                      solicitudId={solicitud.id}
                    />
                  ))}
                </ScrollView>
              )}

              {solicitud.direccion && (
                <Text style={styles.direccion}>📍 {solicitud.direccion}</Text>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.desestimarButton}
                  onPress={() => handleDesestimar(solicitud.id)}
                >
                  <Text style={styles.desestimarButtonText}>Desestimar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cotizarButton}
                  onPress={() => {
                    navigation.navigate("ResponderSolicitud", {
                      solicitudId: solicitud.id,
                      servicioNombre: solicitud.servicio_nombre || "Servicio",
                    });
                  }}
                >
                  <Text style={styles.cotizarButtonText}>Cotizar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  solicitudCard: {
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  solicitudHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  clienteFoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  clienteFotoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  clienteFotoPlaceholderText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "bold",
  },
  solicitudHeaderInfo: {
    flex: 1,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  badgeCotizando: {
    backgroundColor: colors.warning + "20",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  badgeYaCotizado: {
    backgroundColor: colors.success + "20",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  servicioNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  clienteNombre: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fecha: {
    fontSize: 12,
    color: colors.textLight,
  },
  descripcion: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  fotosContainer: {
    marginBottom: 16,
    height: 130,
  },
  fotoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  foto: {
    width: "100%",
    height: "100%",
    backgroundColor: "#eee",
  },
  fotoOverlay: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  fotoIndexText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  imageLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
  },
  imageErrorContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.errorLight,
  },
  imageErrorText: {
    fontSize: 24,
    marginBottom: 4,
  },
  imageErrorLabel: {
    fontSize: 10,
    color: colors.error,
    textAlign: "center",
  },
  direccion: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  desestimarButton: {
    flex: 1.3,
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  desestimarButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  cotizarButton: {
    flex: 2,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cotizarButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
});
