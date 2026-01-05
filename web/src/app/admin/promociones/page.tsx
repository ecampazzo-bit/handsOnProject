"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import PromocionForm from "@/components/admin/PromocionForm";

interface Promocion {
  id: string;
  titulo: string;
  descripcion: string | null;
  codigo_cupon: string | null;
  imagen_url: string | null;
  imagen_mobile_url: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  publico_objetivo:
    | "general"
    | "clientes"
    | "prestadores"
    | "categoria_prestadores";
  categoria_id: number | null;
  servicio_id: number | null;
  estado: "borrador" | "activa" | "pausada" | "finalizada" | "cancelada";
  activa: boolean;
  orden_display: number;
  empresa_nombre: string | null;
  empresa_contacto: string | null;
  latitud: number | null;
  longitud: number | null;
  radio_cobertura_km: number | null;
  whatsapp: string | null;
  veces_mostrada: number;
  veces_clic: number;
  veces_usada: number;
  categoria_nombre?: string | null;
  servicio_nombre?: string | null;
}

interface Categoria {
  id: number;
  nombre: string;
}

export default function PromocionesPage() {
  const router = useRouter();
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPromocion, setEditingPromocion] = useState<Promocion | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<
    "all" | "activa" | "borrador" | "pausada" | "finalizada"
  >("all");

  useEffect(() => {
    loadPromociones();
    loadCategorias();

    // Actualizar estadísticas automáticamente cada 30 segundos
    const interval = setInterval(() => {
      loadPromociones();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from("categorias")
        .select("id, nombre")
        .order("nombre");

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error("Error loading categorias:", error);
    }
  };

  const loadPromociones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseAdmin
        .from("promociones")
        .select(
          `
          *,
          categorias(nombre),
          servicios(nombre)
        `
        )
        .order("fecha_creacion", { ascending: false });

      if (error) throw error;

      const promocionesWithNames = (data || []).map((p: any) => ({
        ...p,
        categoria_nombre: p.categorias?.nombre || null,
        servicio_nombre: p.servicios?.nombre || null,
      }));

      setPromociones(promocionesWithNames);
    } catch (error) {
      console.error("Error loading promociones:", error);
      alert("Error al cargar promociones");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta promoción?")) return;

    try {
      const { error } = await supabaseAdmin
        .from("promociones")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadPromociones();
    } catch (error) {
      console.error("Error deleting promocion:", error);
      alert("Error al eliminar promoción");
    }
  };

  const handleToggleEstado = async (promocion: Promocion) => {
    const nuevoEstado = promocion.estado === "activa" ? "pausada" : "activa";

    try {
      const { error } = await supabaseAdmin
        .from("promociones")
        .update({ estado: nuevoEstado, activa: nuevoEstado === "activa" })
        .eq("id", promocion.id);

      if (error) throw error;
      loadPromociones();
    } catch (error) {
      console.error("Error updating estado:", error);
      alert("Error al actualizar estado");
    }
  };

  const filteredPromociones = promociones.filter((p) => {
    const matchesSearch =
      p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.codigo_cupon &&
        p.codigo_cupon.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEstado = filterEstado === "all" || p.estado === filterEstado;

    return matchesSearch && matchesEstado;
  });

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "activa":
        return "bg-green-100 text-green-800";
      case "pausada":
        return "bg-yellow-100 text-yellow-800";
      case "borrador":
        return "bg-gray-100 text-gray-800";
      case "finalizada":
        return "bg-blue-100 text-blue-800";
      case "cancelada":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPublicoObjetivoLabel = (publico: string) => {
    switch (publico) {
      case "general":
        return "General";
      case "clientes":
        return "Clientes";
      case "prestadores":
        return "Prestadores";
      case "categoria_prestadores":
        return "Categoría Específica";
      default:
        return publico;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-700 text-sm sm:text-base">
                ← Volver al Dashboard
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-black">
                Gestión de Promociones
              </h1>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => loadPromociones()}
                className="px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
                title="Actualizar estadísticas"
              >
                🔄 Refrescar
              </button>
              <button
                onClick={() => {
                  setEditingPromocion(null);
                  setShowForm(true);
                }}
                className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                + Nueva Promoción
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título o código..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Estado
              </label>
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as any)}
                aria-label="Filtrar por estado"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white"
              >
                <option value="all">Todos</option>
                <option value="activa">Activas</option>
                <option value="borrador">Borradores</option>
                <option value="pausada">Pausadas</option>
                <option value="finalizada">Finalizadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Promociones */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-black">Cargando promociones...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPromociones.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-black">No se encontraron promociones</p>
              </div>
            ) : (
              filteredPromociones.map((promocion) => (
                <div
                  key={promocion.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Imagen */}
                  {promocion.imagen_url && (
                    <div className="relative w-full h-48 bg-gray-200">
                      <Image
                        src={promocion.imagen_url}
                        alt={promocion.titulo}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Contenido */}
                  <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h3 className="text-base sm:text-lg font-semibold text-black flex-1 min-w-0 break-words">
                        {promocion.titulo}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${getEstadoBadgeColor(
                          promocion.estado
                        )}`}
                      >
                        {promocion.estado}
                      </span>
                    </div>

                    {promocion.descripcion && (
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {promocion.descripcion}
                      </p>
                    )}

                    {promocion.codigo_cupon && (
                      <p className="text-sm font-mono text-blue-600 mb-2 break-all">
                        Código: {promocion.codigo_cupon}
                      </p>
                    )}

                    <div className="text-xs text-gray-600 space-y-1 mb-3">
                      <p>
                        Público:{" "}
                        {getPublicoObjetivoLabel(promocion.publico_objetivo)}
                      </p>
                      {promocion.categoria_nombre && (
                        <p>Categoría: {promocion.categoria_nombre}</p>
                      )}
                      <p>
                        {new Date(promocion.fecha_inicio).toLocaleDateString(
                          "es-AR"
                        )}{" "}
                        -{" "}
                        {new Date(promocion.fecha_fin).toLocaleDateString(
                          "es-AR"
                        )}
                      </p>
                      <p>
                        Usos: {promocion.veces_usada || 0} / Clics:{" "}
                        {promocion.veces_clic || 0} / Vistas:{" "}
                        {promocion.veces_mostrada || 0}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => {
                          setEditingPromocion(promocion);
                          setShowForm(true);
                        }}
                        className="flex-1 min-w-[80px] px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs sm:text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleEstado(promocion)}
                        className="flex-1 min-w-[80px] px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-xs sm:text-sm"
                      >
                        {promocion.estado === "activa" ? "Pausar" : "Activar"}
                      </button>
                      <button
                        onClick={() => handleDelete(promocion.id)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs sm:text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Modal de Formulario */}
      {showForm && (
        <PromocionForm
          promocion={editingPromocion}
          categorias={categorias}
          onClose={() => {
            setShowForm(false);
            setEditingPromocion(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingPromocion(null);
            loadPromociones();
          }}
        />
      )}
    </div>
  );
}
