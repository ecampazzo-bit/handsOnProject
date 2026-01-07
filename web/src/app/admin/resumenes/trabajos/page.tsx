'use client'

import { useEffect, useState } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS_TRABAJOS = {
  programado: '#6B7280', // gris
  en_camino: '#8B5CF6', // morado
  en_progreso: '#6366F1', // indigo
  pausado: '#F59E0B', // amber
  completado: '#10B981', // verde
  cancelado: '#EF4444', // rojo
}

export default function TrabajosResumen() {
  const [loading, setLoading] = useState(true)
  const [totalTrabajos, setTotalTrabajos] = useState(0)
  const [trabajosPorEstado, setTrabajosPorEstado] = useState({
    programado: 0,
    en_camino: 0,
    en_progreso: 0,
    pausado: 0,
    completado: 0,
    cancelado: 0,
  })
  const [filtroEstado, setFiltroEstado] = useState<string>('all')
  const [filtroCategoria, setFiltroCategoria] = useState<number | 'all'>('all')
  const [categorias, setCategorias] = useState<Array<{ id: number; nombre: string }>>([])
  const [datosGrafico, setDatosGrafico] = useState<Array<{ name: string; value: number; color: string }>>([])

  useEffect(() => {
    loadCategorias()
  }, [])

  useEffect(() => {
    loadData()
  }, [filtroEstado, filtroCategoria])

  const loadCategorias = async () => {
    try {
      const { data: categoriasData } = await supabaseAdmin
        .from('categorias')
        .select('id, nombre')
        .order('nombre')
      
      if (categoriasData) {
        setCategorias(categoriasData)
      }
    } catch (error) {
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)

      // Cargar trabajos con filtros
      let trabajosQuery = supabaseAdmin
        .from('trabajos')
        .select('estado, solicitud_id')

      if (filtroEstado !== 'all') {
        trabajosQuery = trabajosQuery.eq('estado', filtroEstado)
      }

      const { data: trabajosData } = await trabajosQuery

      // Si hay filtro de categoría, filtrar por categoría
      let trabajosFiltrados = trabajosData || []
      if (filtroCategoria !== 'all' && trabajosData) {
        // Obtener IDs de solicitudes que pertenecen a la categoría
        const { data: solicitudesData } = await supabaseAdmin
          .from('solicitudes_servicio')
          .select('id, servicio_id')
        
        if (solicitudesData) {
          // Obtener servicios de la categoría
          const { data: serviciosData } = await supabaseAdmin
            .from('servicios')
            .select('id')
            .eq('categoria_id', filtroCategoria)
          
          if (serviciosData) {
            const serviciosIds = serviciosData.map(s => s.id)
            const solicitudesIds = solicitudesData
              .filter(s => serviciosIds.includes(s.servicio_id))
              .map(s => s.id)
            
            trabajosFiltrados = trabajosData.filter(
              (trab: any) => solicitudesIds.includes(trab.solicitud_id)
            )
          }
        }
      }

      const trabajosPorEstadoMap = {
        programado: 0,
        en_camino: 0,
        en_progreso: 0,
        pausado: 0,
        completado: 0,
        cancelado: 0,
      }

      trabajosFiltrados.forEach((trab: any) => {
        if (trab.estado in trabajosPorEstadoMap) {
          trabajosPorEstadoMap[trab.estado as keyof typeof trabajosPorEstadoMap]++
        }
      })

      setTotalTrabajos(trabajosFiltrados.length)
      setTrabajosPorEstado(trabajosPorEstadoMap)

      // Preparar datos para gráficos
      const datos = [
        { name: 'Programados', value: trabajosPorEstadoMap.programado, color: COLORS_TRABAJOS.programado },
        { name: 'En Camino', value: trabajosPorEstadoMap.en_camino, color: COLORS_TRABAJOS.en_camino },
        { name: 'En Progreso', value: trabajosPorEstadoMap.en_progreso, color: COLORS_TRABAJOS.en_progreso },
        { name: 'Pausados', value: trabajosPorEstadoMap.pausado, color: COLORS_TRABAJOS.pausado },
        { name: 'Completados', value: trabajosPorEstadoMap.completado, color: COLORS_TRABAJOS.completado },
        { name: 'Cancelados', value: trabajosPorEstadoMap.cancelado, color: COLORS_TRABAJOS.cancelado },
      ].filter(item => item.value > 0)

      setDatosGrafico(datos)
    } catch (error: any) {
      alert(`Error al cargar trabajos: ${error?.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="text-gray-900 font-semibold">{payload[0].name}</p>
          <p className="text-gray-700">
            Cantidad: <span className="font-bold">{payload[0].value}</span>
          </p>
          {totalTrabajos > 0 && (
            <p className="text-gray-600 text-sm">
              Porcentaje: {((payload[0].value / totalTrabajos) * 100).toFixed(1)}%
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const trabajosEnCurso = trabajosPorEstado.programado + trabajosPorEstado.en_camino + trabajosPorEstado.en_progreso + trabajosPorEstado.pausado
  const trabajosRealizados = trabajosPorEstado.completado
  const trabajosTerminados = trabajosPorEstado.completado
  const trabajosCancelados = trabajosPorEstado.cancelado

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
            <h1 className="text-2xl font-bold text-gray-900">Resumen de Trabajos</h1>
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
            <p className="mt-4 text-gray-600">Cargando trabajos...</p>
          </div>
        ) : (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Filtros</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Estado <span className="text-gray-400 text-xs">(Opcional)</span>
                  </label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="programado">Programados</option>
                    <option value="en_camino">En Camino</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="pausado">Pausados</option>
                    <option value="completado">Completados</option>
                    <option value="cancelado">Cancelados</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Categoría <span className="text-gray-400 text-xs">(Opcional)</span>
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
              </div>
            </div>

            {/* Métricas Numéricas */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Métricas de Trabajos</h2>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-3xl font-bold text-blue-600">{totalTrabajos}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Realizados</p>
                  <p className="text-3xl font-bold text-green-600">{trabajosRealizados}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">En Curso</p>
                  <p className="text-3xl font-bold text-yellow-600">{trabajosEnCurso}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Terminados</p>
                  <p className="text-3xl font-bold text-purple-600">{trabajosTerminados}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Cancelados</p>
                  <p className="text-3xl font-bold text-red-600">{trabajosCancelados}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Programados</p>
                  <p className="text-3xl font-bold text-gray-700">{trabajosPorEstado.programado}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">En Progreso</p>
                  <p className="text-3xl font-bold text-indigo-600">{trabajosPorEstado.en_progreso}</p>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            {datosGrafico.length > 0 ? (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Gráficos de Trabajos</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 text-center">Gráfico de Torta</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={datosGrafico}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {datosGrafico.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 text-center">Gráfico de Barras</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={datosGrafico}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#6366F1">
                          {datosGrafico.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-center py-8">No hay datos de trabajos para mostrar</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

