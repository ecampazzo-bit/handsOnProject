'use client'

import { useState } from 'react'
import { supabaseAdmin } from '@/lib/supabase'

interface Categoria {
  id?: number
  nombre: string
  url: string | null
}

interface Props {
  categoria: Categoria | null
  onClose: () => void
  onSuccess: () => void
}

export default function CategoriaForm({ categoria, onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState<Categoria>({
    nombre: '',
    url: null,
    ...categoria,
  })

  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageInputKey, setImageInputKey] = useState(0)
  const [imagePreview, setImagePreview] = useState<string | null>(categoria?.url || null)

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)

      // Validar que el archivo existe
      if (!file) {
        throw new Error('No se seleccionó ningún archivo')
      }

      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
      if (!validTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no válido. Use JPEG, PNG, WebP o SVG. Tipo recibido: ${file.type}`)
      }

      // Validar tamaño (2MB máximo para iconos)
      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        throw new Error(`El archivo es demasiado grande. Máximo 2MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      }

      if (file.size === 0) {
        throw new Error('El archivo está vacío (0 bytes)')
      }

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      
      // Si no hay categoria.id, usar un UUID temporal
      // que será reemplazado cuando se cree la categoría
      const tempId = categoria?.id || `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const filePath = `${tempId}/${fileName}`

      // Intentar listar buckets para verificar (opcional, no bloqueante)
      try {
        const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
        if (!bucketError && buckets) {
          const bucketExists = buckets.some(b => b.name === 'categorias')
        }
      } catch (listError) {
      }

      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('categorias')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) {
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error(
            'El bucket "categorias" no existe. Por favor créalo primero ejecutando: scripts/crear_bucket_categorias.sql'
          )
        }
        throw uploadError
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('categorias')
        .getPublicUrl(filePath)

      setFormData({ ...formData, url: publicUrl })
      setImagePreview(publicUrl)
      setImageInputKey(prev => prev + 1)
    } catch (error: any) {
      alert(`Error al subir imagen: ${error.message || 'Error desconocido'}`)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      alert('El nombre de la categoría es requerido')
      return
    }

    try {
      setLoading(true)

      let finalUrl = formData.url

      // Si hay una URL temporal (temp_) y es una nueva categoría, necesitamos mover el archivo
      if (finalUrl && finalUrl.includes('/temp_') && !categoria?.id) {
        // Primero crear la categoría
        const { data: newCategoria, error: createError } = await supabaseAdmin
          .from('categorias')
          .insert({ nombre: formData.nombre.trim(), url: null })
          .select()
          .single()

        if (createError) throw createError

        // Mover el archivo del path temporal al path real
        const tempPathMatch = finalUrl.match(/\/categorias\/(.+)$/)
        if (tempPathMatch && newCategoria) {
          const oldPath = tempPathMatch[1]
          const fileExt = oldPath.split('.').pop()
          const newPath = `${newCategoria.id}/icono.${fileExt}`

          // Copiar archivo a nueva ubicación
          const { data: fileData, error: copyError } = await supabaseAdmin.storage
            .from('categorias')
            .copy(oldPath, newPath)

          if (!copyError) {
            // Obtener nueva URL pública
            const { data: { publicUrl } } = supabaseAdmin.storage
              .from('categorias')
              .getPublicUrl(newPath)
            finalUrl = publicUrl

            // Eliminar archivo temporal
            await supabaseAdmin.storage
              .from('categorias')
              .remove([oldPath])
          }
        }

        // Actualizar la categoría con la URL final
        const { error: updateError } = await supabaseAdmin
          .from('categorias')
          .update({ url: finalUrl })
          .eq('id', newCategoria.id)

        if (updateError) throw updateError
      } else {
        // Si es edición o la URL ya está correcta, solo actualizar
        if (categoria?.id) {
          const { error } = await supabaseAdmin
            .from('categorias')
            .update({
              nombre: formData.nombre.trim(),
              url: finalUrl,
            })
            .eq('id', categoria.id)

          if (error) throw error
        } else {
          const { error } = await supabaseAdmin
            .from('categorias')
            .insert({
              nombre: formData.nombre.trim(),
              url: finalUrl,
            })

          if (error) throw error
        }
      }

      onSuccess()
    } catch (error: any) {
      alert(`Error al guardar categoría: ${error.message || 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icono de la Categoría
            </label>
            <div className="space-y-4">
              {imagePreview && (
                <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
              <input
                key={imageInputKey}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={uploadingImage}
              />
              {uploadingImage && (
                <p className="text-sm text-blue-600">Subiendo imagen...</p>
              )}
              <p className="text-xs text-gray-500">
                Formatos aceptados: JPEG, PNG, WebP, SVG. Tamaño máximo: 2MB
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className={`flex-1 px-6 py-2 rounded-lg transition-colors ${
                loading || uploadingImage
                  ? 'bg-blue-300 text-white cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Guardando...' : (categoria ? 'Actualizar Categoría' : 'Crear Categoría')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

