'use client'

import { useEffect, useState } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS_COTIZACIONES = {
  enviada: '#3B82F6', // azul
  vista: '#FBBF24', // amarillo
  aceptada: '#10B981', // verde
  rechazada: '#EF4444', // rojo
  expirada: '#F97316', // naranja
}

export default function PresupuestosResumen() {
  const [loading, setLoading] = useState(true)
  const [totalCotizaciones, setTotalCotizaciones] = useState(0)
  const [cotizacionesPorEstado, setCotizacionesPorEstado] = useState({
    enviada: 0,
    vista: 0,
    aceptada: 0,
    rechazada: 0,
    expirada: 0,
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
      console.error('Error al cargar categorías:', error)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)

      // Cargar cotizaciones con filtros
      let cotizacionesQuery = supabaseAdmin
        .from('cotizaciones')
        .select('estado, solicitud_id')

      if (filtroEstado !== 'all') {
        cotizacionesQuery = cotizacionesQuery.eq('estado', filtroEstado)
      }

      const { data: cotizacionesData } = await cotizacionesQuery

      // Si hay filtro de categoría, filtrar por categoría
      let cotizacionesFiltradas = cotizacionesData || []
      if (filtroCategoria !== 'all' && cotizacionesData) {
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
            
            cotizacionesFiltradas = cotizacionesData.filter(
              (cot: any) => solicitudesIds.includes(cot.solicitud_id)
            )
          }
        }
      }

      const cotizacionesPorEstadoMap = {
        enviada: 0,
        vista: 0,
        aceptada: 0,
        rechazada: 0,
        expirada: 0,
      }

      cotizacionesFiltradas.forEach((cot: any) => {
        if (cot.estado in cotizacionesPorEstadoMap) {
          cotizacionesPorEstadoMap[cot.estado as keyof typeof cotizacionesPorEstadoMap]++
        }
      })

      setTotalCotizaciones(cotizacionesFiltradas.length)
      setCotizacionesPorEstado(cotizacionesPorEstadoMap)

      // Preparar datos para gráficos
      const datos = [
        { name: 'Enviadas', value: cotizacionesPorEstadoMap.enviada, color: COLORS_COTIZACIONES.enviada },
        { name: 'Vistas', value: cotizacionesPorEstadoMap.vista, color: COLORS_COTIZACIONES.vista },
        { name: 'Aceptadas', value: cotizacionesPorEstadoMap.aceptada, color: COLORS_COTIZACIONES.aceptada },
        { name: 'Rechazadas', value: cotizacionesPorEstadoMap.rechazada, color: COLORS_COTIZACIONES.rechazada },
        { name: 'Expiradas', value: cotizacionesPorEstadoMap.expirada, color: COLORS_COTIZACIONES.expirada },
      ].filter(item => item.value > 0)

      setDatosGrafico(datos)
    } catch (error: any) {
      console.error('Error al cargar presupuestos:', error)
      alert(`Error al cargar presupuestos: ${error?.message || 'Error desconocido'}`)
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
          {totalCotizaciones > 0 && (
            <p className="text-gray-600 text-sm">
              Porcentaje: {((payload[0].value / totalCotizaciones) * 100).toFixed(1)}%
            </p>
          )}
        </div>
      )
    }
    return null
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
              loading="eager"
            />
            <h1 className="text-2xl font-bold text-gray-900">Resumen de Presupuestos</h1>
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
            <p className="mt-4 text-gray-600">Cargando presupuestos...</p>
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
                    <option value="enviada">Enviadas</option>
                    <option value="vista">Vistas</option>
                    <option value="aceptada">Aceptadas</option>
                    <option value="rechazada">Rechazadas</option>
                    <option value="expirada">Expiradas</option>
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
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Métricas de Presupuestos</h2>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-3xl font-bold text-blue-600">{totalCotizaciones}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Enviadas</p>
                  <p className="text-3xl font-bold text-gray-700">{cotizacionesPorEstado.enviada}</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Vistas</p>
                  <p className="text-3xl font-bold text-yellow-600">{cotizacionesPorEstado.vista}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Aceptadas</p>
                  <p className="text-3xl font-bold text-green-600">{cotizacionesPorEstado.aceptada}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Rechazadas</p>
                  <p className="text-3xl font-bold text-red-600">{cotizacionesPorEstado.rechazada}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Expiradas</p>
                  <p className="text-3xl font-bold text-orange-600">{cotizacionesPorEstado.expirada}</p>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            {datosGrafico.length > 0 ? (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Gráficos de Presupuestos</h2>
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
                        <Bar dataKey="value" fill="#3B82F6">
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
                <p className="text-gray-500 text-center py-8">No hay datos de presupuestos para mostrar</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

