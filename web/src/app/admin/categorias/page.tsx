"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import CategoriaForm from "@/components/admin/CategoriaForm";
import Image from "next/image";

interface Categoria {
  id: number;
  nombre: string;
  url: string | null;
  created_at: string;
  servicios_count?: number;
}

interface Servicio {
  id: number;
  nombre: string;
  categoria_id: number;
  created_at: string;
}

export default function CategoriasPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(false);
  const [showServiciosModal, setShowServiciosModal] = useState(false);
  const [newServicioNombre, setNewServicioNombre] = useState("");

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      const { data: categoriasData, error } = await supabaseAdmin
        .from("categorias")
        .select("*")
        .order("nombre");

      if (error) throw error;

      // Obtener conteo de servicios por categoría
      const { data: serviciosData } = await supabaseAdmin
        .from("servicios")
        .select("categoria_id");

      const serviciosCountMap = new Map<number, number>();
      (serviciosData || []).forEach((s: any) => {
        if (s.categoria_id) {
          serviciosCountMap.set(
            s.categoria_id,
            (serviciosCountMap.get(s.categoria_id) || 0) + 1
          );
        }
      });

      const categoriasWithCount = (categoriasData || []).map((cat: any) => ({
        ...cat,
        servicios_count: serviciosCountMap.get(cat.id) || 0,
      }));

      setCategorias(categoriasWithCount);
    } catch (error) {
      console.error("Error loading categorias:", error);
      alert("Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  };

  const loadServicios = async (categoriaId: number) => {
    try {
      setLoadingServicios(true);
      const { data, error } = await supabaseAdmin
        .from("servicios")
        .select("*")
        .eq("categoria_id", categoriaId)
        .order("nombre");

      if (error) throw error;
      setServicios(data || []);
    } catch (error) {
      console.error("Error loading servicios:", error);
      alert("Error al cargar servicios");
    } finally {
      setLoadingServicios(false);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta categoría? Los servicios asociados no se eliminarán, pero quedarán sin categoría.")) {
      return;
    }

    try {
      // Primero, desasociar servicios (opcional: poner categoria_id en null)
      await supabaseAdmin
        .from("servicios")
        .update({ categoria_id: null })
        .eq("categoria_id", id);

      const { error } = await supabaseAdmin
        .from("categorias")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadCategorias();
    } catch (error) {
      console.error("Error deleting categoria:", error);
      alert("Error al eliminar la categoría");
    }
  };

  const handleViewServicios = async (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    setShowServiciosModal(true);
    await loadServicios(categoria.id);
  };

  const handleAddServicio = async () => {
    if (!selectedCategoria || !newServicioNombre.trim()) {
      alert("Por favor, ingresa un nombre para el servicio");
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from("servicios")
        .insert({
          nombre: newServicioNombre.trim(),
          categoria_id: selectedCategoria.id,
        });

      if (error) throw error;
      setNewServicioNombre("");
      await loadServicios(selectedCategoria.id);
      await loadCategorias(); // Actualizar contador
    } catch (error) {
      console.error("Error adding servicio:", error);
      alert("Error al agregar el servicio");
    }
  };

  const handleDeleteServicio = async (servicioId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este servicio?")) {
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from("servicios")
        .delete()
        .eq("id", servicioId);

      if (error) throw error;
      if (selectedCategoria) {
        await loadServicios(selectedCategoria.id);
        await loadCategorias(); // Actualizar contador
      }
    } catch (error) {
      console.error("Error deleting servicio:", error);
      alert("Error al eliminar el servicio");
    }
  };

  const handleLogout = async () => {
    await supabaseAdmin.auth.signOut();
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("admin_user_id");
    router.push("/admin/login");
  };

  const filteredCategorias = categorias.filter((cat) =>
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            />
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/promociones"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Promociones
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Buscador y botón agregar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar categorías..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => {
                setEditingCategoria(null);
                setShowForm(true);
              }}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
            >
              + Agregar Categoría
            </button>
          </div>
        </div>

        {/* Lista de categorías */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando categorías...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategorias.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow p-8 text-center text-gray-500">
                {searchTerm
                  ? "No se encontraron categorías que coincidan con la búsqueda"
                  : "No hay categorías. Agrega una nueva categoría."}
              </div>
            ) : (
              filteredCategorias.map((categoria) => (
                <div
                  key={categoria.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {categoria.nombre}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {categoria.servicios_count || 0} servicio(s)
                      </p>
                    </div>
                    {categoria.url && (
                      <div className="ml-4 flex-shrink-0">
                        <img
                          src={categoria.url}
                          alt={categoria.nombre}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleViewServicios(categoria)}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Ver Servicios
                    </button>
                    <button
                      onClick={() => handleEdit(categoria)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(categoria.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Modal de Formulario */}
      {showForm && (
        <CategoriaForm
          categoria={editingCategoria}
          onClose={() => {
            setShowForm(false);
            setEditingCategoria(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingCategoria(null);
            loadCategorias();
          }}
        />
      )}

      {/* Modal de Servicios */}
      {showServiciosModal && selectedCategoria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Servicios de: {selectedCategoria.nombre}
              </h2>
              <button
                onClick={() => {
                  setShowServiciosModal(false);
                  setSelectedCategoria(null);
                  setServicios([]);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newServicioNombre}
                  onChange={(e) => setNewServicioNombre(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddServicio()}
                  placeholder="Nombre del servicio..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddServicio}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Agregar
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingServicios ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando servicios...</p>
                </div>
              ) : servicios.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay servicios en esta categoría
                </div>
              ) : (
                <ul className="space-y-2">
                  {servicios.map((servicio) => (
                    <li
                      key={servicio.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <span className="text-gray-900">{servicio.nombre}</span>
                      <button
                        onClick={() => handleDeleteServicio(servicio.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

