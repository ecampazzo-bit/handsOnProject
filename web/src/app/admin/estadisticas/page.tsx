"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";

interface Estadisticas {
  totalCotizaciones: number;
  cotizacionesPorEstado: {
    enviada: number;
    vista: number;
    aceptada: number;
    rechazada: number;
    expirada: number;
  };
  totalTrabajos: number;
  trabajosPorEstado: {
    programado: number;
    en_camino: number;
    en_progreso: number;
    pausado: number;
    completado: number;
    cancelado: number;
  };
  prestadoresPorCategoria: Array<{
    categoria_id: number;
    categoria_nombre: string;
    cantidad_prestadores: number;
  }>;
}

interface Prestador {
  id: number;
  usuario_id: string;
  nombre: string;
  apellido: string;
  email: string;
  categoria_id: number | null;
  categoria_nombre: string;
  todas_las_categorias_ids?: number[];
}

export default function EstadisticasDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingPrestadores, setLoadingPrestadores] = useState(false);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<number | "all">("all");
  const [filtroPrestador, setFiltroPrestador] = useState<number | "all">("all");
  const [busquedaPrestador, setBusquedaPrestador] = useState("");
  const [categorias, setCategorias] = useState<
    Array<{ id: number; nombre: string }>
  >([]);
  const [filtroLatitud, setFiltroLatitud] = useState<number | null>(null);
  const [filtroLongitud, setFiltroLongitud] = useState<number | null>(null);
  const [filtroRadio, setFiltroRadio] = useState<number>(10); // Radio en km

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Solo cargar prestadores si hay filtros activos
    if (
      filtroCategoria !== "all" ||
      busquedaPrestador.trim() !== "" ||
      (filtroLatitud !== null && filtroLongitud !== null)
    ) {
      loadPrestadores();
    } else {
      setPrestadores([]);
    }
  }, [
    filtroCategoria,
    busquedaPrestador,
    filtroLatitud,
    filtroLongitud,
    filtroRadio,
  ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  // Actualizar prestadores por categoría cuando cambia el filtro
  useEffect(() => {
    if (!estadisticas) return;

    const actualizarPrestadoresPorCategoria = async () => {
      try {
        const { data: prestadoresPorCategoriaData } = await supabaseAdmin.rpc(
          "get_prestadores_por_categoria"
        );

        if (prestadoresPorCategoriaData) {
          // Si hay filtro de categoría, mostrar solo esa categoría
          let prestadoresFiltrados = prestadoresPorCategoriaData;
          if (filtroCategoria !== "all") {
            prestadoresFiltrados = prestadoresPorCategoriaData.filter(
              (item: {
                categoria_id: number;
                categoria_nombre: string;
                cantidad_prestadores: number;
              }) => item.categoria_id === filtroCategoria
            );
          }

          setEstadisticas((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              prestadoresPorCategoria: prestadoresFiltrados,
            };
          });
        }
      } catch (error) {
        console.error("Error al recalcular prestadores por categoría:", error);
      }
    };

    actualizarPrestadoresPorCategoria();
  }, [filtroCategoria]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar categorías
      const { data: categoriasData } = await supabaseAdmin
        .from("categorias")
        .select("id, nombre")
        .order("nombre");

      if (categoriasData) {
        setCategorias(categoriasData);
      }

      // Cargar estadísticas de cotizaciones
      const { data: cotizacionesData } = await supabaseAdmin
        .from("cotizaciones")
        .select("estado");

      const cotizacionesPorEstado = {
        enviada: 0,
        vista: 0,
        aceptada: 0,
        rechazada: 0,
        expirada: 0,
      };

      cotizacionesData?.forEach((cot) => {
        if (cot.estado in cotizacionesPorEstado) {
          cotizacionesPorEstado[
            cot.estado as keyof typeof cotizacionesPorEstado
          ]++;
        }
      });

      // Cargar estadísticas de trabajos
      const { data: trabajosData } = await supabaseAdmin
        .from("trabajos")
        .select("estado");

      const trabajosPorEstado = {
        programado: 0,
        en_camino: 0,
        en_progreso: 0,
        pausado: 0,
        completado: 0,
        cancelado: 0,
      };

      trabajosData?.forEach((trab) => {
        if (trab.estado in trabajosPorEstado) {
          trabajosPorEstado[trab.estado as keyof typeof trabajosPorEstado]++;
        }
      });

      // Cargar prestadores por categoría
      const { data: prestadoresPorCategoriaData } = await supabaseAdmin.rpc(
        "get_prestadores_por_categoria"
      );

      // Si la función RPC no existe, calcular manualmente
      let prestadoresPorCategoria: Estadisticas["prestadoresPorCategoria"] = [];

      if (prestadoresPorCategoriaData) {
        prestadoresPorCategoria = prestadoresPorCategoriaData;
      } else {
        // Calcular manualmente
        const { data: prestadoresData } = await supabaseAdmin.from(
          "prestadores"
        ).select(`
            id,
            usuario_id,
            prestador_servicios!inner(
              servicio_id,
              servicios!inner(
                categoria_id,
                categorias!inner(
                  id,
                  nombre
                )
              )
            )
          `);

        const categoriaMap = new Map<
          number,
          { nombre: string; count: number }
        >();

        prestadoresData?.forEach((prestador) => {
          const servicios = prestador.prestador_servicios as any[];
          servicios.forEach((ps: any) => {
            const categoria = ps.servicios?.categorias;
            if (categoria) {
              const catId = categoria.id;
              const catNombre = categoria.nombre;
              if (!categoriaMap.has(catId)) {
                categoriaMap.set(catId, { nombre: catNombre, count: 0 });
              }
            }
          });
        });

        // Contar prestadores únicos por categoría
        const prestadoresUnicosPorCategoria = new Map<number, Set<number>>();

        prestadoresData?.forEach((prestador) => {
          const servicios = prestador.prestador_servicios as any[];
          servicios.forEach((ps: any) => {
            const categoria = ps.servicios?.categorias;
            if (categoria) {
              const catId = categoria.id;
              if (!prestadoresUnicosPorCategoria.has(catId)) {
                prestadoresUnicosPorCategoria.set(catId, new Set());
              }
              prestadoresUnicosPorCategoria.get(catId)?.add(prestador.id);
            }
          });
        });

        prestadoresPorCategoria = Array.from(categoriaMap.entries()).map(
          ([id, data]) => ({
            categoria_id: id,
            categoria_nombre: data.nombre,
            cantidad_prestadores:
              prestadoresUnicosPorCategoria.get(id)?.size || 0,
          })
        );
      }

      setEstadisticas({
        totalCotizaciones: cotizacionesData?.length || 0,
        cotizacionesPorEstado,
        totalTrabajos: trabajosData?.length || 0,
        trabajosPorEstado,
        prestadoresPorCategoria,
      });

      // Cargar prestadores solo si hay filtros activos
      if (
        filtroCategoria !== "all" ||
        busquedaPrestador.trim() !== "" ||
        (filtroLatitud !== null && filtroLongitud !== null)
      ) {
        await loadPrestadores();
      } else {
        setPrestadores([]);
      }
    } catch (error: any) {
      console.error("Error al cargar estadísticas:", error);
      alert(
        `Error al cargar estadísticas: ${error?.message || "Error desconocido"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const loadPrestadores = async () => {
    try {
      setLoadingPrestadores(true);

      // Estrategia 1: Obtener TODOS los prestadores primero (sin join)
      const { data: allPrestadores, error: allPrestadoresError } =
        await supabaseAdmin.from("prestadores").select("id, usuario_id");

      if (allPrestadoresError) {
        console.error("Error al obtener prestadores:", allPrestadoresError);
        return;
      }

      if (!allPrestadores || allPrestadores.length === 0) {
        setPrestadores([]);
        return;
      }

      // Estrategia 2: Obtener los datos de usuario por separado
      const { data: usersData } = await supabaseAdmin
        .from("users")
        .select("id, nombre, apellido, email, activo");

      // Estrategia 3: Crear un map de usuarios para búsqueda rápida
      const usuariosMap = new Map(usersData?.map((u) => [u.id, u]) || []);

      // Estrategia 4: Filtrar prestadores que tengan usuario activo
      const prestadoresActivos = allPrestadores
        .filter((p) => {
          const user = usuariosMap.get(p.usuario_id);
          return user?.activo === true;
        })
        .map((p) => ({
          ...p,
          users: usuariosMap.get(p.usuario_id),
        }));

      if (!prestadoresActivos || prestadoresActivos.length === 0) {
        setPrestadores([]);
        return;
      }

      // Obtener categorías de cada prestador
      const prestadoresConCategoria = await Promise.all(
        prestadoresActivos.map(async (prestador: any) => {
          // Obtener servicios del prestador
          const { data: serviciosData } = await supabaseAdmin
            .from("prestador_servicios")
            .select(
              `
              servicio_id,
              servicios(
                categoria_id,
                categorias(
                  id,
                  nombre
                )
              )
            `
            )
            .eq("prestador_id", prestador.id);

          // Obtener todas las categorías del prestador
          let categorias: any[] = [];
          if (serviciosData && serviciosData.length > 0) {
            serviciosData.forEach((ps: any) => {
              if (ps.servicios && ps.servicios.categorias) {
                const categoria = ps.servicios.categorias;
                // Verificar si la categoría ya está en el array
                if (!categorias.find((c: any) => c.id === categoria.id)) {
                  categorias.push(categoria);
                }
              }
            });
          }

          const categoriaPrincipal = categorias[0] || null;
          const todasLasCategoriasIds = categorias.map((cat: any) => cat.id);

          return {
            id: prestador.id,
            usuario_id: prestador.usuario_id,
            nombre: prestador.users?.nombre || "",
            apellido: prestador.users?.apellido || "",
            email: prestador.users?.email || "",
            categoria_id: categoriaPrincipal?.id || null,
            categoria_nombre: categoriaPrincipal?.nombre || "Sin categoría",
            todas_las_categorias_ids: todasLasCategoriasIds, // Para filtrar correctamente
          };
        })
      );

      // Aplicar filtros
      let prestadoresFiltrados = prestadoresConCategoria;

      if (filtroCategoria !== "all") {
        prestadoresFiltrados = prestadoresFiltrados.filter((p: any) => {
          const tieneCategoria =
            p.todas_las_categorias_ids &&
            p.todas_las_categorias_ids.some(
              (catId: number) => Number(catId) === Number(filtroCategoria)
            );
          return tieneCategoria;
        });
      }

      if (filtroPrestador !== "all") {
        prestadoresFiltrados = prestadoresFiltrados.filter(
          (p) => p.id === filtroPrestador
        );
      }

      // Filtrar por búsqueda de nombre o email
      if (busquedaPrestador.trim() !== "") {
        const busquedaLower = busquedaPrestador.toLowerCase().trim();
        prestadoresFiltrados = prestadoresFiltrados.filter(
          (p) =>
            p.nombre.toLowerCase().includes(busquedaLower) ||
            p.apellido.toLowerCase().includes(busquedaLower) ||
            p.email.toLowerCase().includes(busquedaLower) ||
            `${p.nombre} ${p.apellido}`.toLowerCase().includes(busquedaLower)
        );
      }

      // Filtrar por geolocalización si se proporciona
      if (filtroLatitud !== null && filtroLongitud !== null) {
        const prestadoresConUbicacion = await Promise.all(
          prestadoresFiltrados.map(async (prestador) => {
            // Obtener ubicación del prestador desde users
            const { data: userData } = await supabaseAdmin
              .from("users")
              .select("latitud, longitud")
              .eq("id", prestador.usuario_id)
              .single();

            if (userData?.latitud && userData?.longitud) {
              // Calcular distancia usando fórmula de Haversine
              const distancia = calcularDistancia(
                filtroLatitud,
                filtroLongitud,
                Number(userData.latitud),
                Number(userData.longitud)
              );

              return distancia <= filtroRadio ? prestador : null;
            }
            return null;
          })
        );
        prestadoresFiltrados = prestadoresFiltrados.filter((p) => {
          const prestadorConUbicacion = prestadoresConUbicacion.find(
            (pu) => pu?.id === p.id
          );
          return (
            prestadorConUbicacion !== null &&
            prestadorConUbicacion !== undefined
          );
        });
      }

      setPrestadores(prestadoresFiltrados);
    } catch (error: any) {
      console.error("Error al cargar prestadores:", error);
    } finally {
      setLoadingPrestadores(false);
    }
  };

  const trabajosEnCurso =
    (estadisticas?.trabajosPorEstado.programado || 0) +
    (estadisticas?.trabajosPorEstado.en_camino || 0) +
    (estadisticas?.trabajosPorEstado.en_progreso || 0) +
    (estadisticas?.trabajosPorEstado.pausado || 0);

  const trabajosRealizados = estadisticas?.trabajosPorEstado.completado || 0;
  const trabajosTerminados = estadisticas?.trabajosPorEstado.completado || 0;
  const trabajosCancelados = estadisticas?.trabajosPorEstado.cancelado || 0;

  // Función para calcular distancia entre dos puntos (fórmula de Haversine)
  const calcularDistancia = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image
              src="/logo-color.png"
              alt="ofiSí Logo"
              width={120}
              height={72}
              className="h-auto"
              loading="eager"
            />
            <h1 className="text-2xl font-bold text-gray-900">
              Estadísticas del Sistema
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Gestión de Usuarios
            </Link>
            <Link
              href="/admin/categorias"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Gestión de Categorías
            </Link>
            <Link
              href="/admin/promociones"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Gestión de Promociones
            </Link>
            <Link
              href="/admin/resumenes"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Resúmenes y Gráficos
            </Link>
            <Link
              href="/admin/prestadores"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Prestadores
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
          </div>
        ) : estadisticas ? (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                Filtros
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Categoría{" "}
                    <span className="text-gray-400 text-xs">(Opcional)</span>
                  </label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => {
                      const newValue =
                        e.target.value === "all"
                          ? "all"
                          : Number(e.target.value);
                      setFiltroCategoria(newValue);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="all">Todas las categorías</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar Prestador (nombre o email)
                  </label>
                  <input
                    type="text"
                    value={busquedaPrestador}
                    onChange={(e) => {
                      setBusquedaPrestador(e.target.value);
                      if (e.target.value === "") {
                        setFiltroPrestador("all");
                      }
                    }}
                    placeholder="Buscar por nombre o email..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Ubicación (Latitud){" "}
                    <span className="text-gray-400 text-xs">(Opcional)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={filtroLatitud || ""}
                    onChange={(e) =>
                      setFiltroLatitud(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="Ej: -29.4131"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Ubicación (Longitud){" "}
                    <span className="text-gray-400 text-xs">(Opcional)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={filtroLongitud || ""}
                    onChange={(e) =>
                      setFiltroLongitud(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="Ej: -66.8558"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Radio de Cobertura (km){" "}
                    <span className="text-gray-400 text-xs">(Opcional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={filtroRadio}
                    onChange={(e) => setFiltroRadio(Number(e.target.value))}
                    disabled={filtroLatitud === null || filtroLongitud === null}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {filtroLatitud === null || filtroLongitud === null
                      ? "Ingresa latitud y longitud para habilitar"
                      : "Filtro activo"}
                  </p>
                </div>
              </div>
            </div>

            {/* Estadísticas de Cotizaciones */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Presupuestos (Cotizaciones)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {estadisticas.totalCotizaciones}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Enviadas</p>
                  <p className="text-3xl font-bold text-gray-700">
                    {estadisticas.cotizacionesPorEstado.enviada}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Vistas</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {estadisticas.cotizacionesPorEstado.vista}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Aceptadas</p>
                  <p className="text-3xl font-bold text-green-600">
                    {estadisticas.cotizacionesPorEstado.aceptada}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Rechazadas</p>
                  <p className="text-3xl font-bold text-red-600">
                    {estadisticas.cotizacionesPorEstado.rechazada}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Expiradas</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {estadisticas.cotizacionesPorEstado.expirada}
                  </p>
                </div>
              </div>
            </div>

            {/* Estadísticas de Trabajos */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Trabajos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {estadisticas.totalTrabajos}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Realizados</p>
                  <p className="text-3xl font-bold text-green-600">
                    {trabajosRealizados}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">En Curso</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {trabajosEnCurso}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Terminados</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {trabajosTerminados}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Cancelados</p>
                  <p className="text-3xl font-bold text-red-600">
                    {trabajosCancelados}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Programados</p>
                  <p className="text-3xl font-bold text-gray-700">
                    {estadisticas.trabajosPorEstado.programado}
                  </p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">En Progreso</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {estadisticas.trabajosPorEstado.en_progreso}
                  </p>
                </div>
              </div>
            </div>

            {/* Prestadores por Categoría */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Prestadores Activos por Categoría
                {filtroCategoria !== "all" && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (Filtrado por:{" "}
                    {categorias.find((c) => c.id === filtroCategoria)?.nombre ||
                      "Categoría"}
                    )
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {estadisticas.prestadoresPorCategoria.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">
                      No hay prestadores en la categoría seleccionada
                    </p>
                  </div>
                ) : (
                  estadisticas.prestadoresPorCategoria.map((item) => (
                    <div
                      key={item.categoria_id}
                      className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200"
                    >
                      <p className="text-sm text-gray-600 mb-1">
                        {item.categoria_nombre}
                      </p>
                      <p className="text-3xl font-bold text-purple-600">
                        {item.cantidad_prestadores}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        prestadores activos
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Lista de Prestadores */}
            {(filtroCategoria !== "all" ||
              busquedaPrestador.trim() !== "" ||
              (filtroLatitud !== null && filtroLongitud !== null)) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  Prestadores Filtrados
                  {prestadores.length > 0 && (
                    <span className="text-lg font-normal text-gray-600 ml-2">
                      ({prestadores.length}{" "}
                      {prestadores.length === 1 ? "prestador" : "prestadores"})
                    </span>
                  )}
                </h2>
                {loadingPrestadores ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-500">
                      Cargando prestadores...
                    </p>
                  </div>
                ) : prestadores.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No se encontraron prestadores con los filtros seleccionados
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Nombre
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Categoría
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {prestadores.map((prestador) => (
                          <tr key={prestador.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                              {prestador.nombre} {prestador.apellido}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {prestador.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                {prestador.categoria_nombre}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No se pudieron cargar las estadísticas
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
