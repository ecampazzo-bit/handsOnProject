-- ============================================================================
-- AGREGAR CAMPO WHATSAPP A TABLA PROMOCIONES
-- ============================================================================
-- Este script agrega el campo whatsapp para automatizar el envío de mensajes
-- cuando un usuario solicite una promoción.
-- ============================================================================

-- Agregar columna whatsapp si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'promociones' 
      AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE public.promociones 
    ADD COLUMN whatsapp text;
    
    COMMENT ON COLUMN public.promociones.whatsapp IS 
      'Número de WhatsApp para contacto y envío automático de promociones (formato: +5491123456789)';
  END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Para verificar que la columna fue agregada:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'promociones' 
--   AND column_name = 'whatsapp';
-- ============================================================================

