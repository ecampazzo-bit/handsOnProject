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
} from "react-native";
import { supabase } from "../services/supabaseClient";
import { colors } from "../constants/colors";

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
}

export const BuscarServicios: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState<number | null>(null);

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
          "id, nombre, apellido, telefono, calificacion_promedio, cantidad_calificaciones"
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
            <ScrollView
              style={styles.prestadoresList}
              contentContainerStyle={styles.prestadoresListContent}
            >
              {prestadores.map((prestador) => (
                <View key={prestador.id} style={styles.prestadorCard}>
                  <View style={styles.prestadorHeader}>
                    <View>
                      <Text style={styles.prestadorNombre}>
                        {prestador.nombre} {prestador.apellido}
                      </Text>
                      <Text style={styles.prestadorServicio}>
                        {prestador.servicio_nombre}
                      </Text>
                    </View>
                    {prestador.calificacion_promedio && (
                      <View style={styles.ratingContainer}>
                        <Text style={styles.rating}>
                          ⭐ {prestador.calificacion_promedio.toFixed(1)}
                        </Text>
                        <Text style={styles.ratingCount}>
                          ({prestador.cantidad_calificaciones})
                        </Text>
                      </View>
                    )}
                  </View>
                  {prestador.precio_base && (
                    <Text style={styles.precio}>
                      Precio desde: ${prestador.precio_base}
                    </Text>
                  )}
                  <Text style={styles.telefono}>📞 {prestador.telefono}</Text>
                  <TouchableOpacity style={styles.contactButton}>
                    <Text style={styles.contactButtonText}>Contactar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
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
  prestadorCard: {
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prestadorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  prestadorNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  prestadorServicio: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  ratingContainer: {
    alignItems: "flex-end",
  },
  rating: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.warning,
  },
  ratingCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  precio: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 8,
  },
  telefono: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  contactButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  contactButtonText: {
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
