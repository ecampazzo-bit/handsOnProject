import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
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

interface Servicio {
  id: number;
  nombre: string;
  categoria_id: number;
  categoria_nombre?: string;
}

interface Prestador {
  id: number;
  usuario_id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  calificacion_promedio: number | null;
  cantidad_calificaciones: number;
  servicio_nombre: string;
  precio_base: number | null;
  foto_perfil_url: string | null;
}

// Componente para mostrar estrellas de calificación
const StarRating: React.FC<{ rating: number; size?: number }> = ({
  rating,
  size = 16,
}) => {
  // Asegurar que el rating esté entre 0 y 5
  const normalizedRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {/* Estrellas llenas */}
      {[...Array(fullStars)].map((_, i) => (
        <Text
          key={`full-${i}`}
          style={{ fontSize: size, color: colors.warning, marginRight: 2 }}
        >
          ⭐
        </Text>
      ))}
      {/* Media estrella (si aplica) */}
      {hasHalfStar && (
        <Text style={{ fontSize: size, color: colors.warning, marginRight: 2 }}>
          ⭐
        </Text>
      )}
      {/* Estrellas vacías */}
      {[...Array(emptyStars)].map((_, i) => (
        <Text
          key={`empty-${i}`}
          style={{ fontSize: size, color: colors.border, marginRight: 2 }}
        >
          ☆
        </Text>
      ))}
    </View>
  );
};

type BuscarServiciosNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Home"
>;

export const BuscarServicios: React.FC = () => {
  const navigation = useNavigation<BuscarServiciosNavigationProp>();
  const [searchQuery, setSearchQuery] = useState("");
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState<number | null>(null);
  const [selectedPrestadores, setSelectedPrestadores] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    loadServicios();
  }, []);

  useEffect(() => {
    if (selectedServicio) {
      console.log(
        "useEffect: Cargando prestadores para servicio:",
        selectedServicio
      );
      loadPrestadores(selectedServicio);
    } else {
      console.log("useEffect: Limpiando prestadores");
      setPrestadores([]);
    }
  }, [selectedServicio]);

  const loadServicios = async () => {
    try {
      const { data, error } = await supabase
        .from("servicios")
        .select("id, nombre, categoria_id, categorias(nombre)")
        .order("nombre");

      if (error) {
        console.error("Error al cargar servicios:", error);
        return;
      }

      const serviciosConCategoria = (data || []).map((s: any) => ({
        id: s.id,
        nombre: s.nombre,
        categoria_id: s.categoria_id,
        categoria_nombre: s.categorias?.nombre || "Sin categoría",
      }));

      setServicios(serviciosConCategoria);
    } catch (error) {
      console.error("Error inesperado:", error);
    }
  };

  const loadPrestadores = async (servicioId: number) => {
    setLoading(true);
    try {
      console.log("Buscando prestadores para servicio_id:", servicioId);

      // Primero verificar que el servicio existe
      const { data: servicioData, error: servicioError } = await supabase
        .from("servicios")
        .select("id, nombre")
        .eq("id", servicioId)
        .single();

      if (servicioError || !servicioData) {
        console.error("Error al verificar servicio:", servicioError);
        Alert.alert("Error", "No se encontró el servicio seleccionado");
        return;
      }

      console.log("Servicio encontrado:", servicioData.nombre);

      // Obtener prestador_servicios para este servicio
      const { data: prestadorServicios, error: psError } = await supabase
        .from("prestador_servicios")
        .select("prestador_id, precio_base, servicio_id")
        .eq("servicio_id", servicioId);

      if (psError) {
        console.error("Error al cargar prestador_servicios:", psError);
        Alert.alert("Error", "No se pudieron cargar los prestadores");
        return;
      }

      console.log(
        "prestador_servicios encontrados:",
        prestadorServicios?.length || 0
      );

      if (!prestadorServicios || prestadorServicios.length === 0) {
        console.log("No hay prestadores para este servicio");
        setPrestadores([]);
        return;
      }

      // Obtener los IDs de prestadores únicos
      const prestadorIds = [
        ...new Set(prestadorServicios.map((ps: any) => ps.prestador_id)),
      ];

      console.log("IDs de prestadores a buscar:", prestadorIds);

      // Obtener los prestadores con sus datos de usuario
      const { data: prestadores, error: prestadoresError } = await supabase
        .from("prestadores")
        .select("id, usuario_id")
        .in("id", prestadorIds);

      if (prestadoresError) {
        console.error("Error al cargar prestadores:", prestadoresError);
        Alert.alert("Error", "No se pudieron cargar los prestadores");
        return;
      }

      console.log("Prestadores encontrados:", prestadores?.length || 0);

      if (!prestadores || prestadores.length === 0) {
        console.log("No se encontraron prestadores");
        setPrestadores([]);
        return;
      }

      // Obtener los IDs de usuarios únicos
      const usuarioIds = prestadores.map((p: any) => p.usuario_id);

      // Obtener los datos de usuarios desde users_public
      const { data: usuarios, error: usuariosError } = await supabase
        .from("users_public")
        .select(
          "id, nombre, apellido, telefono, calificacion_promedio, cantidad_calificaciones, foto_perfil_url"
        )
        .in("id", usuarioIds);

      if (usuariosError) {
        console.error("Error al cargar usuarios:", usuariosError);
        Alert.alert(
          "Error",
          "No se pudieron cargar los datos de los prestadores"
        );
        return;
      }

      console.log("Usuarios encontrados:", usuarios?.length || 0);

      // Crear un mapa de usuario_id -> usuario para acceso rápido
      const usuariosMap = new Map((usuarios || []).map((u: any) => [u.id, u]));

      // Crear un mapa de prestador_id -> prestador_servicio
      const psMap = new Map(
        prestadorServicios.map((ps: any) => [ps.prestador_id, ps])
      );

      // Combinar los datos
      const prestadoresData: Prestador[] = prestadores
        .map((prestador: any) => {
          const usuario = usuariosMap.get(prestador.usuario_id);
          const ps = psMap.get(prestador.id);

          if (!usuario) {
            console.warn(
              `No se encontró usuario para prestador ${prestador.id}`
            );
            return null;
          }

          return {
            id: prestador.id,
            usuario_id: prestador.usuario_id,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            telefono: usuario.telefono,
            calificacion_promedio: usuario.calificacion_promedio,
            cantidad_calificaciones: usuario.cantidad_calificaciones,
            servicio_nombre: servicioData.nombre,
            precio_base: ps?.precio_base || null,
            foto_perfil_url: usuario.foto_perfil_url,
          };
        })
        .filter((p): p is Prestador => p !== null);

      console.log("Prestadores procesados:", prestadoresData.length);
      console.log(
        "Datos de prestadores a mostrar:",
        JSON.stringify(prestadoresData, null, 2)
      );
      setPrestadores(prestadoresData);

      // Verificar que el estado se actualizó
      setTimeout(() => {
        console.log(
          "Estado actualizado, prestadores en estado:",
          prestadores.length
        );
      }, 100);
    } catch (error) {
      console.error("Error inesperado:", error);
      Alert.alert("Error", "Ocurrió un error al cargar los prestadores");
    } finally {
      setLoading(false);
    }
  };

  const filteredServicios = servicios.filter((servicio) =>
    servicio.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePrestadorSelection = (prestadorId: number) => {
    const newSelected = new Set(selectedPrestadores);
    if (newSelected.has(prestadorId)) {
      newSelected.delete(prestadorId);
    } else {
      newSelected.add(prestadorId);
    }
    setSelectedPrestadores(newSelected);
  };

  const handleSolicitarPresupuesto = () => {
    if (selectedPrestadores.size === 0) {
      Alert.alert(
        "Selección requerida",
        "Por favor selecciona al menos un prestador para solicitar presupuesto."
      );
      return;
    }

    if (!selectedServicio) {
      Alert.alert("Error", "No hay servicio seleccionado");
      return;
    }

    // Navegar a la pantalla de solicitar presupuesto
    navigation.navigate("SolicitarPresupuesto", {
      servicioId: selectedServicio,
      prestadorIds: Array.from(selectedPrestadores),
    });
  };

  // Limpiar selecciones cuando cambia el servicio o cuando se navega a solicitar presupuesto
  useEffect(() => {
    setSelectedPrestadores(new Set());
  }, [selectedServicio]);

  // Limpiar selecciones cuando se vuelve a esta pantalla (después de solicitar presupuesto)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setSelectedPrestadores(new Set());
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Estoy buscando</Text>
        <Text style={styles.subtitle}>
          Encuentra el profesional que necesitas
        </Text>
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar servicio..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textLight}
        />
      </View>

      {!selectedServicio ? (
        <ScrollView style={styles.serviciosList}>
          {filteredServicios.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No se encontraron servicios"
                  : "Cargando servicios..."}
              </Text>
            </View>
          ) : (
            filteredServicios.map((servicio) => (
              <TouchableOpacity
                key={servicio.id}
                style={styles.servicioCard}
                onPress={() => setSelectedServicio(servicio.id)}
              >
                <View>
                  <Text style={styles.servicioNombre}>{servicio.nombre}</Text>
                  <Text style={styles.servicioCategoria}>
                    {servicio.categoria_nombre}
                  </Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        <View style={styles.prestadoresContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedServicio(null)}
          >
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : prestadores.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No hay prestadores disponibles para este servicio
              </Text>
              <Text style={styles.emptyText}>
                (Debug: prestadores.length = {prestadores.length}, loading ={" "}
                {loading ? "true" : "false"})
              </Text>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.prestadoresList}
                contentContainerStyle={styles.prestadoresListContent}
              >
                <View style={styles.prestadoresGrid}>
                  {prestadores.map((prestador) => {
                    const isSelected = selectedPrestadores.has(prestador.id);
                    return (
                      <TouchableOpacity
                        key={prestador.id}
                        style={[
                          styles.prestadorCard,
                          isSelected && styles.prestadorCardSelected,
                        ]}
                        onPress={() => togglePrestadorSelection(prestador.id)}
                        activeOpacity={0.7}
                      >
                        {/* Checkbox en esquina inferior derecha */}
                        <View
                          style={[
                            styles.checkbox,
                            styles.checkboxAbsolute,
                            isSelected && styles.checkboxSelected,
                          ]}
                        >
                          {isSelected && (
                            <Text style={styles.checkboxCheck}>✓</Text>
                          )}
                        </View>

                        <View style={styles.prestadorContent}>
                          {/* Foto de perfil */}
                          <View style={styles.prestadorLeft}>
                            {prestador.foto_perfil_url ? (
                              <Image
                                source={{ uri: prestador.foto_perfil_url }}
                                style={styles.fotoPerfil}
                              />
                            ) : (
                              <View
                                style={[
                                  styles.fotoPerfil,
                                  styles.fotoPerfilPlaceholder,
                                ]}
                              >
                                <Text style={styles.fotoPerfilText}>
                                  {prestador.nombre.charAt(0)}
                                  {prestador.apellido.charAt(0)}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Información del prestador */}
                          <View style={styles.prestadorInfo}>
                            <Text
                              style={styles.prestadorNombre}
                              numberOfLines={2}
                            >
                              {prestador.nombre} {prestador.apellido}
                            </Text>
                            <Text
                              style={styles.prestadorServicio}
                              numberOfLines={1}
                            >
                              {prestador.servicio_nombre}
                            </Text>

                            {/* Calificación */}
                            <View style={styles.ratingSection}>
                              {prestador.calificacion_promedio !== null &&
                              prestador.calificacion_promedio > 0 ? (
                                <>
                                  <StarRating
                                    rating={prestador.calificacion_promedio}
                                    size={12}
                                  />
                                  <Text style={styles.ratingNumber}>
                                    {prestador.calificacion_promedio.toFixed(1)}
                                  </Text>
                                  {prestador.cantidad_calificaciones > 0 && (
                                    <Text style={styles.ratingCount}>
                                      ({prestador.cantidad_calificaciones})
                                    </Text>
                                  )}
                                </>
                              ) : (
                                <Text style={styles.noRatingText}>
                                  Sin calificaciones
                                </Text>
                              )}
                            </View>

                            {prestador.precio_base && (
                              <Text style={styles.precio} numberOfLines={1}>
                                ${prestador.precio_base}
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Botón de solicitar presupuesto */}
              {selectedPrestadores.size > 0 && (
                <View style={styles.bottomButtonContainer}>
                  <TouchableOpacity
                    style={styles.solicitarButton}
                    onPress={handleSolicitarPresupuesto}
                  >
                    <Text style={styles.solicitarButtonText}>
                      Solicitar presupuesto ({selectedPrestadores.size})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  serviciosList: {
    flex: 1,
  },
  servicioCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  servicioNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  servicioCategoria: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  arrow: {
    fontSize: 20,
    color: colors.primary,
  },
  prestadoresContainer: {
    flex: 1,
  },
  backButton: {
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  prestadoresList: {
    flex: 1,
  },
  prestadoresListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  prestadoresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  prestadorCard: {
    backgroundColor: colors.white,
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    width: "48%", // Dos columnas con espacio entre ellas
    position: "relative", // Para posicionar el checkbox absolutamente
  },
  prestadorCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + "10",
  },
  prestadorContent: {
    alignItems: "center",
  },
  prestadorLeft: {
    alignItems: "center",
  },
  fotoPerfil: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  fotoPerfilPlaceholder: {
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  fotoPerfilText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxAbsolute: {
    position: "absolute",
    bottom: 8,
    right: 8,
    zIndex: 10,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
  },
  checkboxCheck: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  prestadorInfo: {
    width: "100%",
    alignItems: "center",
  },
  prestadorNombre: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
    textAlign: "center",
  },
  prestadorServicio: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    textAlign: "center",
  },
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  noRatingText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  precio: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 4,
    textAlign: "center",
  },
  bottomButtonContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  solicitarButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  solicitarButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
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
});
