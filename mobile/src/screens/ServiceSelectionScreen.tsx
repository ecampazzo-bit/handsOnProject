import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { saveUserServices, getCurrentUserId } from "../services/authService";
import { supabase } from "../services/supabaseClient";
import { ServiceCard } from "../components/ServiceCard";
import { Button } from "../components/Button";
import { colors } from "../constants/colors";
import { RootStackParamList } from "../types/navigation";

type ServiceSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ServiceSelection"
>;

interface Servicio {
  id: number;
  nombre: string;
  categoria_id: number;
  categoria_nombre?: string;
}

interface Categoria {
  id: number;
  nombre: string;
  url: string | null;
}

export const ServiceSelectionScreen: React.FC = (props: any) => {
  const route = props.route || { params: { userId: undefined } };
  const paramUserId = route.params?.userId;
  const navigation = useNavigation<ServiceSelectionScreenNavigationProp>();
  const [selectedServices, setSelectedServices] = useState<Set<number>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Verificar sesión al montar el componente
  React.useEffect(() => {
    const checkAndRestoreSession = async () => {
      console.log("=== Verificando sesión en ServiceSelectionScreen ===");
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.warn("No hay sesión activa, intentando restaurar...");
          const userId = await getCurrentUserId();
          if (userId) {
            console.log("Sesión restaurada exitosamente:", userId);
          } else {
            console.warn("No se pudo restaurar la sesión desde AsyncStorage");
          }
        } else {
          console.log(
            "Sesión verificada en ServiceSelection:",
            session.user.id
          );
        }
      } catch (error) {
        console.error("Error al verificar/restaurar sesión:", error);
      }
    };

    checkAndRestoreSession();
  }, []);

  useEffect(() => {
    loadCategorias();
    loadServicios();
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

  const loadServicios = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from("servicios")
        .select("id, nombre, categoria_id, categorias(nombre)")
        .order("nombre");

      if (error) {
        console.error("Error al cargar servicios:", error);
        Alert.alert("Error", "No se pudieron cargar los servicios");
        return;
      }

      const serviciosWithCategory = (data || []).map((servicio: any) => ({
        id: servicio.id,
        nombre: servicio.nombre,
        categoria_id: servicio.categoria_id,
        categoria_nombre: servicio.categorias?.nombre,
      }));

      setServicios(serviciosWithCategory);
    } catch (error) {
      console.error("Error inesperado al cargar servicios:", error);
      Alert.alert("Error", "Ocurrió un error al cargar los servicios");
    } finally {
      setLoadingData(false);
    }
  };

  const filteredServicios = useMemo(() => {
    return servicios.filter((servicio) => {
      const matchesSearch = servicio.nombre
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategoria =
        selectedCategoria === null ||
        servicio.categoria_id === selectedCategoria;
      return matchesSearch && matchesCategoria;
    });
  }, [servicios, searchQuery, selectedCategoria]);

  const toggleService = (serviceId: number) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const handleSave = async () => {
    if (selectedServices.size === 0) {
      Alert.alert("Error", "Debes seleccionar al menos un servicio");
      return;
    }

    setLoading(true);
    try {
      const finalUserId = paramUserId || (await getCurrentUserId());

      if (!finalUserId) {
        console.error(
          "No se pudo obtener el userId después de varios intentos"
        );
        Alert.alert(
          "Error",
          "No se pudo obtener la información del usuario. Por favor, intenta iniciar sesión nuevamente."
        );
        setLoading(false);
        return;
      }

      console.log("UserId obtenido:", finalUserId);

      // Obtener los servicios seleccionados con sus categorías
      const servicesToSave: Array<{ nombre: string; categoria: string }> = [];

      selectedServices.forEach((serviceId) => {
        const servicio = servicios.find((s) => s.id === serviceId);
        if (servicio) {
          servicesToSave.push({
            nombre: servicio.nombre,
            categoria: servicio.categoria_nombre || "Sin categoría",
          });
        }
      });

      console.log("Guardando servicios para userId:", finalUserId);
      const { error } = await saveUserServices(finalUserId, servicesToSave);

      if (error) {
        Alert.alert(
          "Error",
          error.message || "No se pudieron guardar los servicios"
        );
        return;
      }

      Alert.alert("Éxito", "Servicios guardados correctamente", [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("Home");
          },
        },
      ]);
    } catch (error) {
      console.error("Error en handleSave:", error);
      Alert.alert("Error", "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Selecciona tus servicios</Text>
        <Text style={styles.subtitle}>
          Selecciona todos los servicios que ofreces ({selectedServices.size}{" "}
          seleccionados)
        </Text>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar servicios..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textLight}
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
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
              <View
                style={[
                  styles.categoriaIcon,
                  selectedCategoria === null && styles.categoriaIconSelected,
                ]}
              >
                <Text style={styles.categoriaIconText}>📂</Text>
              </View>
              <Text
                style={[
                  styles.categoriaName,
                  selectedCategoria === null && styles.categoriaNameSelected,
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>
            {categorias.map((categoria) => (
              <TouchableOpacity
                key={categoria.id}
                style={[
                  styles.categoriaCard,
                  selectedCategoria === categoria.id &&
                    styles.categoriaCardSelected,
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
                      selectedCategoria === categoria.id &&
                        styles.categoriaIconSelected,
                    ]}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={[
                      styles.categoriaIcon,
                      selectedCategoria === categoria.id &&
                        styles.categoriaIconSelected,
                    ]}
                  >
                    <Text style={styles.categoriaIconText}>📦</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.categoriaName,
                    selectedCategoria === categoria.id &&
                      styles.categoriaNameSelected,
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

      {/* Lista de Servicios */}
      {loadingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando servicios...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {filteredServicios.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No se encontraron servicios"
                  : "No hay servicios disponibles"}
              </Text>
            </View>
          ) : (
            filteredServicios.map((servicio) => (
              <ServiceCard
                key={servicio.id}
                serviceName={servicio.nombre}
                isSelected={selectedServices.has(servicio.id)}
                onToggle={() => toggleService(servicio.id)}
              />
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Button
          title={`Guardar y Continuar (${selectedServices.size})`}
          onPress={handleSave}
          loading={loading}
          disabled={selectedServices.size === 0}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  searchIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  categoriasCarouselContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  footer: {
    padding: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

