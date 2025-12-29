'use client'

import { useState, useEffect } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import Image from 'next/image'

interface Promocion {
  id?: string
  titulo: string
  descripcion: string | null
  codigo_cupon: string | null
  imagen_url: string | null
  imagen_mobile_url: string | null
  fecha_inicio: string
  fecha_fin: string
  publico_objetivo: 'general' | 'clientes' | 'prestadores' | 'categoria_prestadores'
  categoria_id: number | null
  servicio_id: number | null
  estado: 'borrador' | 'activa' | 'pausada' | 'finalizada' | 'cancelada'
  activa: boolean
  orden_display: number
  empresa_nombre: string | null
  empresa_contacto: string | null
  whatsapp: string | null
  latitud: number | null
  longitud: number | null
  radio_cobertura_km: number | null
}

interface Categoria {
  id: number
  nombre: string
}

interface Servicio {
  id: number
  nombre: string
}

interface Props {
  promocion: Promocion | null
  categorias: Categoria[]
  onClose: () => void
  onSuccess: () => void
}

export default function PromocionForm({ promocion, categorias, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<Promocion>({
    titulo: '',
    descripcion: null,
    codigo_cupon: null,
    imagen_url: null,
    imagen_mobile_url: null,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    publico_objetivo: 'general',
    categoria_id: null,
    servicio_id: null,
    estado: 'borrador',
    activa: true,
    orden_display: 0,
    empresa_nombre: null,
    empresa_contacto: null,
    whatsapp: null,
    latitud: null,
    longitud: null,
    radio_cobertura_km: null,
    ...promocion,
  })

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingMobileImage, setUploadingMobileImage] = useState(false)
  const [imageInputKey, setImageInputKey] = useState(0)
  const [mobileImageInputKey, setMobileImageInputKey] = useState(0)
  const [imagePreview, setImagePreview] = useState<string | null>(promocion?.imagen_url || null)
  const [mobileImagePreview, setMobileImagePreview] = useState<string | null>(promocion?.imagen_mobile_url || null)

  useEffect(() => {
    if (formData.publico_objetivo === 'categoria_prestadores' && formData.categoria_id) {
      loadServicios(formData.categoria_id)
    }
  }, [formData.publico_objetivo, formData.categoria_id])

  const loadServicios = async (categoriaId: number) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('servicios')
        .select('id, nombre')
        .eq('categoria_id', categoriaId)
        .order('nombre')

      if (error) throw error
      setServicios(data || [])
    } catch (error) {
      console.error('Error loading servicios:', error)
    }
  }

  const handleImageUpload = async (file: File, isMobile: boolean = false) => {
    console.log('handleImageUpload llamado:', { file, isMobile, fileName: file.name, fileSize: file.size, fileType: file.type })
    
    try {
      if (isMobile) {
        setUploadingMobileImage(true)
      } else {
        setUploadingImage(true)
      }

      // Validar que el archivo existe
      if (!file) {
        throw new Error('No se seleccionó ningún archivo')
      }

      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no válido. Use JPEG, PNG o WebP. Tipo recibido: ${file.type}`)
      }

      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error(`El archivo es demasiado grande. Máximo 5MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      }

      if (file.size === 0) {
        throw new Error('El archivo está vacío (0 bytes)')
      }

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      
      // Si no hay promocion.id, usar un UUID temporal
      // que será reemplazado cuando se cree la promoción
      const tempId = promocion?.id || `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const filePath = `${tempId}/${isMobile ? 'mobile_' : ''}${fileName}`

      console.log('Subiendo imagen a:', filePath)

      // Intentar listar buckets para verificar (opcional, no bloqueante)
      try {
        const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
        if (!bucketError && buckets) {
          console.log('Buckets disponibles:', buckets.map(b => b.name))
          const bucketExists = buckets.some(b => b.name === 'promociones')
          if (bucketExists) {
            console.log('Bucket "promociones" confirmado como existente')
          } else {
            console.warn('Bucket "promociones" no encontrado en la lista, pero intentando subir de todas formas')
          }
        } else {
          console.warn('No se pudo listar buckets, pero intentando subir de todas formas:', bucketError)
        }
      } catch (listError) {
        console.warn('Error al listar buckets (continuando):', listError)
      }

      // Subir archivo a Storage
      console.log('Iniciando upload con:', { filePath, fileType: file.type, fileSize: file.size })
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('promociones')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Permitir sobrescribir si existe
          contentType: file.type,
        })

      if (uploadError) {
        console.error('Error de upload completo:', uploadError)
        console.error('Detalles del error:', JSON.stringify(uploadError, null, 2))
        
        // Mensaje de error más descriptivo
        let errorMessage = uploadError.message || 'Error desconocido'
        
        // Si el error menciona "bucket" o "not found", dar instrucciones específicas
        if (uploadError.message?.toLowerCase().includes('bucket') || 
            uploadError.message?.toLowerCase().includes('not found')) {
          errorMessage = `Error al subir imagen: ${uploadError.message}\n\n` +
            'El bucket "promociones" podría no existir o no tener los permisos correctos.\n\n' +
            'Verifica:\n' +
            '1. Que el bucket existe en Supabase Dashboard > Storage\n' +
            '2. Que las políticas RLS están configuradas (ejecuta: scripts/configurar_bucket_promociones.sql)\n' +
            '3. Que el service_role_key está configurado correctamente en .env.local'
        }
        
        throw new Error(errorMessage)
      }

      console.log('Imagen subida exitosamente:', uploadData)

      // Obtener URL pública
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('promociones')
        .getPublicUrl(filePath)

      console.log('URL pública generada:', publicUrl)

      // Actualizar estado
      console.log('Actualizando estado con URL:', publicUrl)
      if (isMobile) {
        setFormData((prev) => ({ ...prev, imagen_mobile_url: publicUrl }))
        setMobileImagePreview(publicUrl)
        setUploadingMobileImage(false)
        setMobileImageInputKey((prev) => prev + 1) // Reset input
      } else {
        setFormData((prev) => ({ ...prev, imagen_url: publicUrl }))
        setImagePreview(publicUrl)
        setUploadingImage(false)
        setImageInputKey((prev) => prev + 1) // Reset input
      }
      console.log('Estado actualizado exitosamente')
    } catch (error: any) {
      console.error('Error uploading image completo:', error)
      console.error('Stack trace:', error.stack)
      const errorMessage = error?.message || 'Error desconocido al subir imagen'
      alert(`Error al subir imagen: ${errorMessage}`)
      if (isMobile) {
        setUploadingMobileImage(false)
      } else {
        setUploadingImage(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que hay imagen principal (siempre requerida)
    if (!formData.imagen_url) {
      alert('Debe subir una imagen principal antes de guardar la promoción')
      setLoading(false)
      return
    }

    setLoading(true)

    try {

      let promocionId = promocion?.id
      let imagenUrl = formData.imagen_url
      let imagenMobileUrl = formData.imagen_mobile_url

      if (promocionId) {
        // Actualizar promoción existente
        // Si las URLs tienen 'temp_', necesitamos mover los archivos
        if (imagenUrl?.includes('/temp_')) {
          // Mover imagen principal al path correcto
          const newPath = imagenUrl.replace(/\/temp_[^\/]+/, `/${promocionId}`)
          const oldPath = imagenUrl.split('/promociones/')[1]
          
          // Copiar archivo al nuevo path
          const { data: copyData, error: copyError } = await supabaseAdmin.storage
            .from('promociones')
            .copy(oldPath, newPath.split('/promociones/')[1])
          
          if (!copyError) {
            // Eliminar archivo temporal
            await supabaseAdmin.storage.from('promociones').remove([oldPath])
            imagenUrl = supabaseAdmin.storage.from('promociones').getPublicUrl(newPath.split('/promociones/')[1]).data.publicUrl
          }
        }

        if (imagenMobileUrl?.includes('/temp_')) {
          const newPath = imagenMobileUrl.replace(/\/temp_[^\/]+/, `/${promocionId}`)
          const oldPath = imagenMobileUrl.split('/promociones/')[1]
          
          const { data: copyData, error: copyError } = await supabaseAdmin.storage
            .from('promociones')
            .copy(oldPath, newPath.split('/promociones/')[1])
          
          if (!copyError) {
            await supabaseAdmin.storage.from('promociones').remove([oldPath])
            imagenMobileUrl = supabaseAdmin.storage.from('promociones').getPublicUrl(newPath.split('/promociones/')[1]).data.publicUrl
          }
        }

        const { error } = await supabaseAdmin
          .from('promociones')
          .update({
            titulo: formData.titulo,
            descripcion: formData.descripcion || null,
            codigo_cupon: formData.codigo_cupon || null,
            imagen_url: imagenUrl,
            imagen_mobile_url: imagenMobileUrl || null,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
            publico_objetivo: formData.publico_objetivo,
            categoria_id: formData.categoria_id || null,
            servicio_id: formData.servicio_id || null,
            estado: formData.estado,
            activa: formData.activa,
            orden_display: formData.orden_display,
            empresa_nombre: formData.empresa_nombre || null,
            empresa_contacto: formData.empresa_contacto || null,
            whatsapp: formData.whatsapp || null,
            latitud: formData.latitud || null,
            longitud: formData.longitud || null,
            radio_cobertura_km: formData.radio_cobertura_km || null,
          })
          .eq('id', promocionId)

        if (error) throw error
      } else {
        // Crear nueva promoción primero para obtener el ID
        const { data: newPromocion, error: insertError } = await supabaseAdmin
          .from('promociones')
          .insert({
            titulo: formData.titulo,
            descripcion: formData.descripcion || null,
            codigo_cupon: formData.codigo_cupon || null,
            imagen_url: imagenUrl,
            imagen_mobile_url: imagenMobileUrl || null,
            fecha_inicio: formData.fecha_inicio,
            fecha_fin: formData.fecha_fin,
            publico_objetivo: formData.publico_objetivo,
            categoria_id: formData.categoria_id || null,
            servicio_id: formData.servicio_id || null,
            estado: formData.estado,
            activa: formData.activa,
            orden_display: formData.orden_display,
            empresa_nombre: formData.empresa_nombre || null,
            empresa_contacto: formData.empresa_contacto || null,
            whatsapp: formData.whatsapp || null,
            latitud: formData.latitud || null,
            longitud: formData.longitud || null,
            radio_cobertura_km: formData.radio_cobertura_km || null,
          })
          .select()
          .single()

        if (insertError) throw insertError

        promocionId = newPromocion.id

        // Si las imágenes están en carpeta temporal, moverlas a la carpeta correcta
        if (imagenUrl?.includes('/temp_')) {
          const oldPath = imagenUrl.split('/promociones/')[1]
          const newPath = `${promocionId}/${oldPath.split('/').pop()}`
          
          const { error: copyError } = await supabaseAdmin.storage
            .from('promociones')
            .copy(oldPath, newPath)
          
          if (!copyError) {
            // Eliminar archivo temporal
            await supabaseAdmin.storage.from('promociones').remove([oldPath])
            imagenUrl = supabaseAdmin.storage.from('promociones').getPublicUrl(newPath).data.publicUrl
            
            // Actualizar la promoción con la nueva URL
            await supabaseAdmin
              .from('promociones')
              .update({ imagen_url: imagenUrl })
              .eq('id', promocionId)
          }
        }

        if (imagenMobileUrl?.includes('/temp_')) {
          const oldPath = imagenMobileUrl.split('/promociones/')[1]
          const newPath = `${promocionId}/${oldPath.split('/').pop()}`
          
          const { error: copyError } = await supabaseAdmin.storage
            .from('promociones')
            .copy(oldPath, newPath)
          
          if (!copyError) {
            await supabaseAdmin.storage.from('promociones').remove([oldPath])
            imagenMobileUrl = supabaseAdmin.storage.from('promociones').getPublicUrl(newPath).data.publicUrl
            
            await supabaseAdmin
              .from('promociones')
              .update({ imagen_mobile_url: imagenMobileUrl })
              .eq('id', promocionId)
          }
        }
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error saving promocion:', error)
      alert(`Error al guardar promoción: ${error.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {promocion ? 'Editar Promoción' : 'Nueva Promoción'}
          </h2>

          <div className="space-y-6">
            {/* Información Básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Cupón
                </label>
                <input
                  type="text"
                  value={formData.codigo_cupon || ''}
                  onChange={(e) => setFormData({ ...formData, codigo_cupon: e.target.value || null })}
                  placeholder="Ej: VERANO2025"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value || null })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Imágenes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen Principal *
                </label>
                {imagePreview && (
                  <div className="mb-2 relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <input
                  key={imageInputKey}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    console.log('Archivo seleccionado:', file)
                    if (file) {
                      handleImageUpload(file, false)
                    } else {
                      console.warn('No se seleccionó ningún archivo')
                    }
                  }}
                  disabled={uploadingImage}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {uploadingImage && (
                  <p className="text-sm text-gray-500 mt-1">Subiendo imagen...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen Mobile (Opcional)
                </label>
                {mobileImagePreview && (
                  <div className="mb-2 relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={mobileImagePreview}
                      alt="Preview Mobile"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <input
                  key={mobileImageInputKey}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    console.log('Archivo mobile seleccionado:', file)
                    if (file) {
                      handleImageUpload(file, true)
                    } else {
                      console.warn('No se seleccionó ningún archivo mobile')
                    }
                  }}
                  disabled={uploadingMobileImage}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {uploadingMobileImage && (
                  <p className="text-sm text-gray-500 mt-1">Subiendo imagen...</p>
                )}
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Público Objetivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Público Objetivo *
              </label>
              <select
                required
                value={formData.publico_objetivo}
                onChange={(e) => {
                  const newPublico = e.target.value as any
                  setFormData({
                    ...formData,
                    publico_objetivo: newPublico,
                    categoria_id: newPublico !== 'categoria_prestadores' ? null : formData.categoria_id,
                    servicio_id: null,
                  })
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General (Todos)</option>
                <option value="clientes">Clientes</option>
                <option value="prestadores">Prestadores</option>
                <option value="categoria_prestadores">Categoría Específica de Prestadores</option>
              </select>
            </div>

            {/* Categoría (si es necesario) */}
            {formData.publico_objetivo === 'categoria_prestadores' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={formData.categoria_id || ''}
                    onChange={(e) => {
                      const categoriaId = e.target.value ? parseInt(e.target.value) : null
                      setFormData({
                        ...formData,
                        categoria_id: categoriaId,
                        servicio_id: null,
                      })
                      if (categoriaId) loadServicios(categoriaId)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.categoria_id && servicios.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Servicio (Opcional)
                    </label>
                    <select
                      value={formData.servicio_id || ''}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          servicio_id: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos los servicios</option>
                      {servicios.map((serv) => (
                        <option key={serv.id} value={serv.id}>
                          {serv.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Estado y Configuración */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => {
                    const estado = e.target.value as any
                    setFormData({
                      ...formData,
                      estado,
                      activa: estado === 'activa',
                    })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="borrador">Borrador</option>
                  <option value="activa">Activa</option>
                  <option value="pausada">Pausada</option>
                  <option value="finalizada">Finalizada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden de Visualización
                </label>
                <input
                  type="number"
                  value={formData.orden_display}
                  onChange={(e) => setFormData({ ...formData, orden_display: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Información de Empresa */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Empresa
                </label>
                <input
                  type="text"
                  value={formData.empresa_nombre || ''}
                  onChange={(e) => setFormData({ ...formData, empresa_nombre: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contacto (Email/Teléfono)
                </label>
                <input
                  type="text"
                  value={formData.empresa_contacto || ''}
                  onChange={(e) => setFormData({ ...formData, empresa_contacto: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+5491123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para envío automático: "Quiero mi promoción: [Nombre]"
                </p>
              </div>
            </div>

            {/* Geolocalización */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Geolocalización (Opcional)
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Define la ubicación geográfica de la promoción para búsquedas por proximidad.
                Si no se especifica, la promoción será global.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitud || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : null
                      setFormData({ ...formData, latitud: value })
                    }}
                    placeholder="Ej: -34.603722"
                    min="-90"
                    max="90"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Rango: -90 a 90 (negativo = Sur)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitud || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : null
                      setFormData({ ...formData, longitud: value })
                    }}
                    placeholder="Ej: -58.381592"
                    min="-180"
                    max="180"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Rango: -180 a 180 (negativo = Oeste)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Radio de Cobertura (km)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.radio_cobertura_km || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : null
                      setFormData({ ...formData, radio_cobertura_km: value })
                    }}
                    placeholder="Ej: 10"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Radio en kilómetros desde el punto de geolocalización
                  </p>
                </div>
              </div>

              {/* Botón para obtener ubicación actual */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setFormData({
                            ...formData,
                            latitud: parseFloat(position.coords.latitude.toFixed(7)),
                            longitud: parseFloat(position.coords.longitude.toFixed(7)),
                          })
                        },
                        (error) => {
                          alert(`Error al obtener ubicación: ${error.message}`)
                        }
                      )
                    } else {
                      alert('Tu navegador no soporta geolocalización')
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  📍 Usar mi ubicación actual
                </button>
              </div>

              {/* Información adicional */}
              {formData.latitud && formData.longitud && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Ubicación configurada:</strong> {formData.latitud}, {formData.longitud}
                    {formData.radio_cobertura_km && (
                      <span> • Radio: {formData.radio_cobertura_km} km</span>
                    )}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    La promoción será visible para usuarios dentro del área de cobertura.
                    {!formData.radio_cobertura_km && ' Considera agregar un radio de cobertura para mejores resultados.'}
                  </p>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || uploadingImage || uploadingMobileImage || !formData.imagen_url}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!formData.imagen_url ? 'Debe subir una imagen principal antes de guardar' : ''}
              >
                {loading ? 'Guardando...' : promocion ? 'Actualizar' : 'Crear'}
              </button>
              {!formData.imagen_url && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  ⚠️ Debe subir una imagen principal antes de guardar
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

