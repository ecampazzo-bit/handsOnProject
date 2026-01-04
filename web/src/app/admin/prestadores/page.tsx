'use client'

import { useEffect, useState } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

interface Prestador {
  id: number
  usuario_id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  categoria_id: number | null
  categoria_nombre: string
  todas_las_categorias_ids?: number[]
  latitud: number | null
  longitud: number | null
  distancia?: number
}

export default function PrestadoresDashboard() {
  const [loading, setLoading] = useState(true)
  const [prestadores, setPrestadores] = useState<Prestador[]>([])
  const [prestadoresFiltrados, setPrestadoresFiltrados] = useState<Prestador[]>([])
  const [categorias, setCategorias] = useState<Array<{ id: number; nombre: string }>>([])
  const [filtroCategoria, setFiltroCategoria] = useState<number | 'all'>('all')
  const [filtroLatitud, setFiltroLatitud] = useState<number | null>(null)
  const [filtroLongitud, setFiltroLongitud] = useState<number | null>(null)
  const [filtroRadio, setFiltroRadio] = useState<number>(10) // Radio en km
  const [prestadoresPorCategoria, setPrestadoresPorCategoria] = useState<Array<{
    categoria_id: number
    categoria_nombre: string
    cantidad_prestadores: number
  }>>([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Aplicar filtros cuando cambian los valores de los filtros
    aplicarFiltros()
  }, [filtroCategoria, filtroLatitud, filtroLongitud, filtroRadio])

  // Aplicar filtros también cuando se cargan los prestadores
  useEffect(() => {
    if (prestadores.length > 0) {
      aplicarFiltros()
    }
  }, [prestadores])

  const loadData = async () => {
    try {
      setLoading(true)

      // Cargar categorías
      const { data: categoriasData } = await supabaseAdmin
        .from('categorias')
        .select('id, nombre')
        .order('nombre')
      
      if (categoriasData) {
        setCategorias(categoriasData)
      }

      // Cargar prestadores por categoría
      const { data: prestadoresPorCategoriaData } = await supabaseAdmin
        .rpc('get_prestadores_por_categoria')

      if (prestadoresPorCategoriaData) {
        setPrestadoresPorCategoria(prestadoresPorCategoriaData)
      }

      // Cargar todos los prestadores activos
      const { data: prestadoresData, error: prestadoresError } = await supabaseAdmin
        .from('prestadores')
        .select(`
          id,
          usuario_id,
          users!inner(
            id,
            nombre,
            apellido,
            email,
            telefono,
            activo,
            latitud,
            longitud
          )
        `)
        .eq('users.activo', true)

      if (prestadoresError) {
        console.error('Error al cargar prestadores:', prestadoresError)
        return
      }

      if (!prestadoresData || prestadoresData.length === 0) {
        setPrestadores([])
        return
      }

      // Obtener categorías de cada prestador
      const prestadoresConCategoria = await Promise.all(
        prestadoresData.map(async (prestador: any) => {
          // Obtener servicios del prestador
          const { data: serviciosData } = await supabaseAdmin
            .from('prestador_servicios')
            .select(`
              servicio_id,
              servicios(
                categoria_id,
                categorias(
                  id,
                  nombre
                )
              )
            `)
            .eq('prestador_id', prestador.id)

          // Obtener todas las categorías del prestador
          let categorias: any[] = []
          if (serviciosData && serviciosData.length > 0) {
            serviciosData.forEach((ps: any) => {
              if (ps.servicios && ps.servicios.categorias) {
                const categoria = ps.servicios.categorias
                // Verificar si la categoría ya está en el array
                if (!categorias.find((c: any) => c.id === categoria.id)) {
                  categorias.push(categoria)
                }
              }
            })
          }
          
          const categoriaPrincipal = categorias[0] || null
          const todasLasCategoriasIds = categorias.map((cat: any) => cat.id)

          return {
            id: prestador.id,
            usuario_id: prestador.usuario_id,
            nombre: prestador.users?.nombre || '',
            apellido: prestador.users?.apellido || '',
            email: prestador.users?.email || '',
            telefono: prestador.users?.telefono || '',
            categoria_id: categoriaPrincipal?.id || null,
            categoria_nombre: categoriaPrincipal?.nombre || 'Sin categoría',
            todas_las_categorias_ids: todasLasCategoriasIds, // Para filtrar correctamente
            latitud: prestador.users?.latitud ? Number(prestador.users.latitud) : null,
            longitud: prestador.users?.longitud ? Number(prestador.users.longitud) : null,
          }
        })
      )

      setPrestadores(prestadoresConCategoria)
    } catch (error: any) {
      console.error('Error al cargar prestadores:', error)
      alert(`Error al cargar prestadores: ${error?.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  // Función para calcular distancia entre dos puntos (fórmula de Haversine)
  const calcularDistancia = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const aplicarFiltros = () => {
    let filtrados = [...prestadores]

    // Filtrar por categoría
    if (filtroCategoria !== 'all') {
      filtrados = filtrados.filter((p: any) => {
        if (!p.todas_las_categorias_ids || p.todas_las_categorias_ids.length === 0) {
          return false
        }
        // Comparar convirtiendo ambos a número para evitar problemas de tipo
        return p.todas_las_categorias_ids.some((catId: number) => 
          Number(catId) === Number(filtroCategoria)
        )
      })
    }

    // Filtrar por geolocalización (OPCIONAL - solo si se proporcionan ambos valores)
    if (filtroLatitud !== null && filtroLongitud !== null) {
      filtrados = filtrados
        .map((prestador): Prestador | null => {
          if (prestador.latitud !== null && prestador.longitud !== null) {
            const distancia = calcularDistancia(
              filtroLatitud,
              filtroLongitud,
              prestador.latitud,
              prestador.longitud
            )
            if (distancia <= filtroRadio) {
              return { ...prestador, distancia }
            }
            return null
          }
          // Si el prestador no tiene ubicación, lo excluimos cuando se aplica filtro de geolocalización
          return null
        })
        .filter((p): p is Prestador => p !== null)
        .sort((a, b) => (a.distancia || 0) - (b.distancia || 0))
    } else {
      // Si no hay filtro de geolocalización, limpiar distancias
      filtrados = filtrados.map(p => {
        const { distancia, ...rest } = p
        return rest
      })
    }

    setPrestadoresFiltrados(filtrados)
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Prestadores Activos por Categoría</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/resumenes"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              ← Volver
            </Link>
            <Link
              href="/admin/estadisticas"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Estadísticas
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando prestadores...</p>
          </div>
        ) : (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Filtros</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Categoría
                  </label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value === 'all' ? 'all' : Number(e.target.value))}
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
                    Filtrar por Ubicación (Latitud) <span className="text-gray-400 text-xs">(Opcional)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={filtroLatitud || ''}
                    onChange={(e) => setFiltroLatitud(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Ej: -29.4131"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Ubicación (Longitud) <span className="text-gray-400 text-xs">(Opcional)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={filtroLongitud || ''}
                    onChange={(e) => setFiltroLongitud(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Ej: -66.8558"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Radio de Cobertura (km) <span className="text-gray-400 text-xs">(Opcional)</span>
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
                      ? 'Ingresa latitud y longitud para habilitar' 
                      : 'Filtro activo'}
                  </p>
                </div>
              </div>
            </div>

            {/* Prestadores por Categoría */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Prestadores Activos por Categoría
                {filtroCategoria !== 'all' && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (Filtrado por: {categorias.find(c => c.id === filtroCategoria)?.nombre || 'Categoría'})
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prestadoresPorCategoria.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">No hay prestadores en la categoría seleccionada</p>
                  </div>
                ) : (
                  prestadoresPorCategoria
                    .filter(item => filtroCategoria === 'all' || item.categoria_id === filtroCategoria)
                    .map((item) => (
                      <div key={item.categoria_id} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                        <p className="text-sm text-gray-600 mb-1">{item.categoria_nombre}</p>
                        <p className="text-3xl font-bold text-purple-600">{item.cantidad_prestadores}</p>
                        <p className="text-xs text-gray-500 mt-1">prestadores activos</p>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Lista de Prestadores */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Prestadores {filtroCategoria !== 'all' || (filtroLatitud !== null && filtroLongitud !== null) ? 'Filtrados' : 'Activos'}
                <span className="text-lg font-normal text-gray-600 ml-2">
                  ({prestadoresFiltrados.length} {prestadoresFiltrados.length === 1 ? 'prestador' : 'prestadores'})
                </span>
              </h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Cargando prestadores...</p>
                </div>
              ) : prestadoresFiltrados.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {prestadores.length === 0 
                    ? 'No hay prestadores activos en el sistema'
                    : 'No se encontraron prestadores con los filtros seleccionados'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                        {(filtroLatitud !== null && filtroLongitud !== null) && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distancia (km)</th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {prestadoresFiltrados.map((prestador) => (
                        <tr key={prestador.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                            {prestador.nombre} {prestador.apellido}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {prestador.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {prestador.telefono}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              {prestador.categoria_nombre}
                            </span>
                          </td>
                          {(filtroLatitud !== null && filtroLongitud !== null) && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {prestador.distancia !== undefined ? `${prestador.distancia.toFixed(2)} km` : 'N/A'}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {prestador.latitud !== null && prestador.longitud !== null ? (
                              <span className="text-green-600">✓ Con ubicación</span>
                            ) : (
                              <span className="text-gray-400">Sin ubicación</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

