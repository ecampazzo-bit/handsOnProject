import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from "react-native";
import { supabase } from "../services/supabaseClient";
import { getCurrentUser } from "../services/authService";
import { colors } from "../constants/colors";

interface Servicio {
  id: number;
  nombre: string;
  categoria_id: number;
  categoria_nombre?: string;
}

interface PrestadorServicio {
  id: number;
  servicio_id: number;
  servicio_nombre: string;
  precio_base: number | null;
  precio_desde: number | null;
  experiencia_años: number | null;
  destacado: boolean;
}

interface Categoria {
  id: number;
  nombre: string;
  url: string | null;
}

export const OfrezcoServicios: React.FC = () => {
  const [misServicios, setMisServicios] = useState<PrestadorServicio[]>([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState<Servicio[]>(
    []
  );
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [prestadorId, setPrestadorId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre, url")
        .order("nombre");

      if (error) {
        console.error("Error al cargar categorías:", error);
        return;
      }

      setCategorias(data || []);
    } catch (error) {
      console.error("Error inesperado al cargar categorías:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Obtener usuario actual
      const { user, error: userError } = await getCurrentUser();
      if (userError || !user) {
        Alert.alert("Error", "No se pudo obtener la información del usuario");
        return;
      }

      // Obtener prestador_id
      const { data: prestador, error: prestadorError } = await supabase
        .from("prestadores")
        .select("id")
        .eq("usuario_id", user.id)
        .single();

      if (prestadorError || !prestador) {
        Alert.alert(
          "Error",
          "No se encontró tu perfil de prestador. Por favor, completa tu registro."
        );
        return;
      }

      setPrestadorId(prestador.id);

      // Cargar servicios del prestador
      await loadMisServicios(prestador.id);

      // Cargar todos los servicios disponibles
      await loadServiciosDisponibles();
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Alert.alert("Error", "Ocurrió un error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const loadMisServicios = async (prestadorId: number) => {
    try {
      const { data, error } = await supabase
        .from("prestador_servicios")
        .select(
          `
          id,
          servicio_id,
          precio_base,
          precio_desde,
          experiencia_años,
          destacado,
          servicios!inner(nombre)
        `
        )
        .eq("prestador_id", prestadorId)
        .order("fecha_agregado", { ascending: false });

      if (error) {
        console.error("Error al cargar mis servicios:", error);
        return;
      }

      const servicios = (data || []).map((item: any) => ({
        id: item.id,
        servicio_id: item.servicio_id,
        servicio_nombre: item.servicios.nombre,
        precio_base: item.precio_base,
        precio_desde: item.precio_desde,
        experiencia_años: item.experiencia_años,
        destacado: item.destacado,
      }));

      setMisServicios(servicios);
    } catch (error) {
      console.error("Error inesperado:", error);
    }
  };

  const loadServiciosDisponibles = async () => {
    try {
      const { data, error } = await supabase
        .from("servicios")
        .select("id, nombre, categoria_id, categorias(nombre)")
        .order("nombre");

      if (error) {
        console.error("Error al cargar servicios disponibles:", error);
        return;
      }

      const serviciosConCategoria = (data || []).map((s: any) => ({
        id: s.id,
        nombre: s.nombre,
        categoria_id: s.categoria_id,
        categoria_nombre: s.categorias?.nombre || "Sin categoría",
      }));

      setServiciosDisponibles(serviciosConCategoria);
    } catch (error) {
      console.error("Error inesperado:", error);
    }
  };

  const handleAgregarServicio = async (servicioId: number) => {
    if (!prestadorId) {
      Alert.alert("Error", "No se encontró tu perfil de prestador");
      return;
    }

    // Verificar si ya tiene el servicio
    const yaTiene = misServicios.some((s) => s.servicio_id === servicioId);
    if (yaTiene) {
      Alert.alert("Info", "Ya ofreces este servicio");
      return;
    }

    try {
      const { error } = await supabase.from("prestador_servicios").insert({
        prestador_id: prestadorId,
        servicio_id: servicioId,
      });

      if (error) {
        console.error("Error al agregar servicio:", error);
        Alert.alert("Error", "No se pudo agregar el servicio");
        return;
      }

      Alert.alert("Éxito", "Servicio agregado correctamente");
      await loadMisServicios(prestadorId);
    } catch (error) {
      console.error("Error inesperado:", error);
      Alert.alert("Error", "Ocurrió un error inesperado");
    }
  };

  const handleEliminarServicio = async (prestadorServicioId: number) => {
    Alert.alert(
      "Confirmar",
      "¿Estás seguro de que deseas eliminar este servicio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            if (!prestadorId) return;

            try {
              const { error } = await supabase
                .from("prestador_servicios")
                .delete()
                .eq("id", prestadorServicioId);

              if (error) {
                console.error("Error al eliminar servicio:", error);
                Alert.alert("Error", "No se pudo eliminar el servicio");
                return;
              }

              Alert.alert("Éxito", "Servicio eliminado correctamente");
              await loadMisServicios(prestadorId);
            } catch (error) {
              console.error("Error inesperado:", error);
              Alert.alert("Error", "Ocurrió un error inesperado");
            }
          },
        },
      ]
    );
  };

  // Filtrar servicios no ofrecidos y aplicar búsqueda y categoría
  const serviciosNoOfrecidos = useMemo(() => {
    const noOfrecidos = serviciosDisponibles.filter(
      (servicio) => !misServicios.some((s) => s.servicio_id === servicio.id)
    );

    // Filtrar por categoría
    const filtradosPorCategoria = selectedCategoria === null
      ? noOfrecidos
      : noOfrecidos.filter((servicio) => servicio.categoria_id === selectedCategoria);

    // Filtrar por búsqueda
    if (!searchQuery.trim()) {
      return filtradosPorCategoria;
    }

    const query = searchQuery.toLowerCase().trim();
    return filtradosPorCategoria.filter(
      (servicio) =>
        servicio.nombre.toLowerCase().includes(query) ||
        servicio.categoria_nombre?.toLowerCase().includes(query)
    );
  }, [serviciosDisponibles, misServicios, searchQuery, selectedCategoria]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Servicios</Text>
        <Text style={styles.sectionDescription}>
          Servicios que actualmente ofreces ({misServicios.length})
        </Text>

        {misServicios.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Aún no ofreces ningún servicio. Agrega servicios desde la lista de
              abajo.
            </Text>
          </View>
        ) : (
          misServicios.map((servicio) => (
            <View key={servicio.id} style={styles.servicioCard}>
              <View style={styles.servicioInfo}>
                <Text style={styles.servicioNombre}>
                  {servicio.servicio_nombre}
                </Text>
                {servicio.precio_base && (
                  <Text style={styles.precio}>
                    Precio base: ${servicio.precio_base}
                  </Text>
                )}
                {servicio.experiencia_años && (
                  <Text style={styles.experiencia}>
                    Experiencia: {servicio.experiencia_años} años
                  </Text>
                )}
                {servicio.destacado && (
                  <Text style={styles.destacado}>⭐ Destacado</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleEliminarServicio(servicio.id)}
              >
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agregar Servicios</Text>
        <Text style={styles.sectionDescription}>
          Selecciona servicios para agregar a tu perfil
        </Text>

        {/* Campo de búsqueda */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar servicios por nombre..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery("")}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Carrusel de Categorías */}
        {categorias.length > 0 && (
          <View style={styles.categoriasCarouselContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriasCarousel}
              contentContainerStyle={styles.categoriasCarouselContent}
            >
              <TouchableOpacity
                style={[
                  styles.categoriaCard,
                  selectedCategoria === null && styles.categoriaCardSelected,
                ]}
                onPress={() => setSelectedCategoria(null)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoriaIcon, selectedCategoria === null && styles.categoriaIconSelected]}>
                  <Text style={styles.categoriaIconText}>📂</Text>
                </View>
                <Text style={[styles.categoriaName, selectedCategoria === null && styles.categoriaNameSelected]}>
                  Todas
                </Text>
              </TouchableOpacity>
              {categorias.map((categoria) => (
                <TouchableOpacity
                  key={categoria.id}
                  style={[
                    styles.categoriaCard,
                    selectedCategoria === categoria.id && styles.categoriaCardSelected,
                  ]}
                  onPress={() => setSelectedCategoria(categoria.id)}
                  activeOpacity={0.7}
                >
                  {categoria.url ? (
                    <Image
                      source={{ uri: categoria.url }}
                      style={[
                        styles.categoriaIcon,
                        styles.categoriaIconImage,
                        selectedCategoria === categoria.id && styles.categoriaIconSelected,
                      ]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.categoriaIcon, selectedCategoria === categoria.id && styles.categoriaIconSelected]}>
                      <Text style={styles.categoriaIconText}>📦</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.categoriaName,
                      selectedCategoria === categoria.id && styles.categoriaNameSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {categoria.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {serviciosNoOfrecidos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? `No se encontraron servicios que coincidan con "${searchQuery}"`
                : "Ya ofreces todos los servicios disponibles"}
            </Text>
          </View>
        ) : (
          serviciosNoOfrecidos.map((servicio) => (
            <TouchableOpacity
              key={servicio.id}
              style={styles.servicioDisponibleCard}
              onPress={() => handleAgregarServicio(servicio.id)}
            >
              <View>
                <Text style={styles.servicioNombre}>{servicio.nombre}</Text>
                {selectedCategoria === null && (
                  <Text style={styles.servicioCategoria}>
                    {servicio.categoria_nombre}
                  </Text>
                )}
              </View>
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  searchContainer: {
    position: "relative",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  categoriasCarouselContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    marginBottom: 16,
  },
  categoriasCarousel: {
    flexGrow: 0,
  },
  categoriasCarouselContent: {
    paddingHorizontal: 12,
  },
  categoriaCard: {
    width: 90,
    alignItems: "center",
    marginHorizontal: 6,
    paddingVertical: 8,
  },
  categoriaCardSelected: {
    backgroundColor: colors.primaryLight + "20",
    borderRadius: 12,
  },
  categoriaIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    borderWidth: 2,
    borderColor: colors.border,
  },
  categoriaIconImage: {
    backgroundColor: colors.white,
  },
  categoriaIconSelected: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  categoriaIconText: {
    fontSize: 28,
  },
  categoriaName: {
    fontSize: 11,
    color: colors.text,
    textAlign: "center",
    fontWeight: "500",
  },
  categoriaNameSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
  searchIcon: {
    fontSize: 18,
    paddingLeft: 16,
    paddingRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 40,
    fontSize: 16,
    color: colors.text,
  },
  clearButton: {
    position: "absolute",
    right: 12,
    padding: 4,
  },
  clearButtonText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: "bold",
  },
  servicioCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  servicioInfo: {
    flex: 1,
  },
  servicioNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  precio: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 4,
  },
  experiencia: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  destacado: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: colors.error,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  servicioDisponibleCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  servicioCategoria: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addIcon: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: "bold",
  },
  emptyState: {
    padding: 24,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
