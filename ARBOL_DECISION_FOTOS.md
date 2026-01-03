# 🗺️ ÁRBOL DE DECISIÓN: ¿Qué archivo leo?

```
┌─────────────────────────────────────────────────────────────────┐
│  PROBLEMA: La app crashea cuando intento subir una foto       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
               ¿Cuál es tu rol/necesidad?
               
        ┌──────────────┬──────────────┬──────────────┐
        │              │              │              │
        ▼              ▼              ▼              ▼
    Soy Usuario   Soy QA/Tester Soy Developer Soy Manager
     (Solo usar) (Necesito probar) (Entender código) (Reportar)
        │              │              │              │
        ▼              ▼              ▼              ▼
        
    ┌─────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────┐
    │INSTALAR │  │  TESTS   │  │  DIAGNÓSTICO │  │ RESUMEN │
    │solucion │  │ completos│  │  + Solución  │  │ejecutivo│
    └────┬────┘  └─────┬────┘  └──────┬───────┘  └────┬────┘
         │             │              │               │
         ▼             ▼              ▼               ▼
         
┌─────────────────┐
│   ¿Tienes      │
│  más tiempo?    │
└────────┬────────┘
         │
    ┌────┴─────┐
    │           │
 No▼          Si▼
    │           │
    │      ┌────────────────────┐
    │      │ Lee documentación   │
    │      │ técnica detallada   │
    │      │ (SOLUCION_CRASH...)│
    │      └────────────────────┘
    │
    └──────┬──────────────┐
           │              │
         Prueba       ¿Funciona?
        la app            │
           │          ┌───┴────┐
           │          │        │
           ▼         Sí▼      No▼
      ¿Crashea?       │        │
           │      ¡Éxito!    Lee
      ┌────┴────┐             │
      │         │      ┌──────────────────┐
     Sí▼       No▼     │ INSTALACION_     │
      │         │      │ SOLUCION... (paso│
      │     ¡Éxito!    │ solución problemas)
      │         │      └──────────────────┘
      ▼         │
   Lee logs     │
   de error     │
      │         │
      ▼         │
   Abre GitHub  │
   issue con    │
   los logs     │
      │         │
      ▼         ▼
      
      └─────────┬─────────┘
                │
                ▼
         ¡PROBLEMA RESUELTO!
         
```

---

## 🎯 RUTAS RÁPIDAS

### Ruta 1: Instalar y Probar (15 min)
```
START
  │
  ├─→ Lee: INSTALACION_SOLUCION_FOTOS.md (Paso 1-4)
  │
  ├─→ Ejecuta los comandos
  │
  ├─→ Prueba app (5 min)
  │
  ├─→ ¿Funciona? → SÍ → FIN ✅
  │
  └─→ ¿Funciona? → NO → Lee: INSTALACION_SOLUCION_FOTOS.md (Solución de Problemas)
```

### Ruta 2: Entender Primero (45 min)
```
START
  │
  ├─→ Lee: RESUMEN_SOLUCION_FOTOS.md (5 min)
  │
  ├─→ Lee: DIAGNOSTICO_CRASH_FOTOS.md (20 min)
  │
  ├─→ Lee: SOLUCION_CRASH_FOTOS.md (15 min)
  │
  ├─→ Ahora ejecuta la instalación
  │
  └─→ FIN ✅ (Entiendes todo)
```

### Ruta 3: Probar Todo (45 min)
```
START
  │
  ├─→ Lee: INSTALACION_SOLUCION_FOTOS.md (Pasos 1-4)
  │
  ├─→ Ejecuta instalación
  │
  ├─→ Lee: TEST_CRASH_FOTOS.md (al menos Test 1-3)
  │
  ├─→ Ejecuta los tests
  │
  └─→ FIN ✅ (Verificado que funciona)
```

### Ruta 4: Análisis Técnico (90 min)
```
START
  │
  ├─→ Lee: DIAGNOSTICO_CRASH_FOTOS.md (30 min)
  │
  ├─→ Lee: SOLUCION_CRASH_FOTOS.md (30 min)
  │
  ├─→ Abre VS Code y verifica código (15 min)
  │
  ├─→ Lee: TEST_CRASH_FOTOS.md (10 min)
  │
  ├─→ Ejecuta los tests (5 min)
  │
  └─→ FIN ✅ (Eres experto en el cambio)
```

---

## 📋 MATRIZ DE ARCHIVOS

### Por Necesidad:

| Necesidad | Archivo Principal | Secundario | Tiempo |
|-----------|-------------------|-----------|--------|
| Actualizar app | INSTALACION | - | 10 min |
| Entender problema | DIAGNOSTICO | RESUMEN | 25 min |
| Entender solución | SOLUCION | DIAGNOSTICO | 30 min |
| Probar | TEST | SOLUCION | 30 min |
| Reporting | RESUMEN | - | 5 min |
| Mantenimiento | SOLUCION | DIAGNOSTICO | 45 min |

### Por Rol:

| Rol | Orden | Tiempo |
|-----|-------|--------|
| **Usuario Final** | INSTALACION → Prueba | 15 min |
| **QA/Tester** | TEST → SOLUCION → Prueba | 45 min |
| **Dev Junior** | RESUMEN → INSTALACION → TEST | 40 min |
| **Dev Senior** | DIAGNOSTICO → SOLUCION → Código | 60 min |
| **Architect** | DIAGNOSTICO → SOLUCION → Diseño | 75 min |
| **Manager** | RESUMEN | 5 min |

---

## 🔍 BÚSQUEDA RÁPIDA

¿Busco información sobre...?

| Tema | Archivo | Sección |
|------|---------|---------|
| **Qué se rompió** | DIAGNOSTICO | Causas Identificadas |
| **Cómo se arregló** | SOLUCION | Cambios Realizados |
| **Cómo instalar** | INSTALACION | Paso 1-4 |
| **Errores comunes** | INSTALACION | Solución de Problemas |
| **Cómo probar** | TEST | Test 1-8 |
| **Logs esperados** | SOLUCION | Logs Esperados |
| **Validación sesión** | SOLUCION | Cambio 1 |
| **Reintentos** | SOLUCION | Cambio 2 |
| **Manejo permisos** | SOLUCION | Cambio 3 |
| **Código antes/después** | SOLUCION | Cambios Específicos |
| **Rollback** | INSTALACION | Rollback |
| **Performance** | SOLUCION | Futuras Mejoras |

---

## 🎓 APRENDIZAJE PROGRESIVO

### Nivel 1: Usuario (15 min)
```
INSTALACION (Paso 1-4) → Prueba
```
✅ Resultado: La app funciona

### Nivel 2: Junior Dev (40 min)
```
RESUMEN → INSTALACION → TEST 1
```
✅ Resultado: Entiendes el problema y lo resuelves

### Nivel 3: Mid Dev (60 min)
```
DIAGNOSTICO → SOLUCION → TEST (todos)
```
✅ Resultado: Entiendes qué se rompió y por qué

### Nivel 4: Senior Dev (90 min)
```
DIAGNOSTICO → SOLUCION → Código → TEST
```
✅ Resultado: Puedes mantener y mejorar la solución

### Nivel 5: Architect (120 min)
```
DIAGNOSTICO → SOLUCION → Código → TEST → Diseño mejoras
```
✅ Resultado: Puedes rediseñar la arquitectura si necesario

---

## ⚡ CASOS DE USO

### Caso 1: "La app crashea, ayuda!"
```
START
│
├─→ INSTALACION (Pasos 1-4)
├─→ npm install && npm start
├─→ Prueba
├─→ ¿Funciona? → SÍ → FIN ✅
└─→ ¿Funciona? → NO → Lee "Solución de Problemas"
```

### Caso 2: "¿Por qué pasó esto?"
```
START
│
├─→ RESUMEN (2 min)
├─→ DIAGNOSTICO (20 min)
└─→ FIN ✅ (Ya sabes por qué)
```

### Caso 3: "Necesito probar que funciona"
```
START
│
├─→ INSTALACION (instalación)
├─→ TEST (elige tests)
├─→ Ejecuta tests
└─→ FIN ✅ (Todo verificado)
```

### Caso 4: "Tengo que mantener esto"
```
START
│
├─→ SOLUCION (entiende cambios)
├─→ Abre código en VS Code
├─→ TEST (ejecuta todos)
└─→ FIN ✅ (Listo para mantener)
```

### Caso 5: "Reporto a management"
```
START
│
├─→ RESUMEN (leyendo 5 min)
└─→ FIN ✅ (Ya tienes el resumen ejecutivo)
```

---

## 🗂️ ESTRUCTURA VISUAL

```
DOCUMENTACION/
│
├─ INDICE_DOCUMENTACION_FOTOS.md ← TÚ ESTÁS AQUÍ (Mapa completo)
│
├─ RESUMEN_SOLUCION_FOTOS.md ← Empieza aquí (5 min)
│
├─ INSTALACION_SOLUCION_FOTOS.md ← Luego aquí (10 min)
│  └─ Te llevaría a instalar
│
├─ DIAGNOSTICO_CRASH_FOTOS.md ← Si quieres detalles (20 min)
│
├─ SOLUCION_CRASH_FOTOS.md ← Para entender código (25 min)
│  └─ Apunta a archivos de código modificados
│
└─ TEST_CRASH_FOTOS.md ← Para probar (30 min)
   └─ Te guía a probar toda la solución

CÓDIGO/
├─ mobile/src/services/solicitudService.ts ✅ MODIFICADO
└─ mobile/src/screens/SolicitarPresupuestoScreen.tsx ✅ MODIFICADO
```

---

## ✨ RECOMENDACIONES POR PERFIL

### 👤 Usuario Final
- Solo necesita: **INSTALACION_SOLUCION_FOTOS.md**
- Tiempo: 10-15 minutos
- Objetivo: Que la app funcione

### 🧪 QA / Tester
- Necesita: **INSTALACION** + **TEST**
- Tiempo: 30-45 minutos
- Objetivo: Verificar que funciona

### 🔧 Desarrollador
- Necesita: **SOLUCION** + **DIAGNOSTICO** (opcional)
- Tiempo: 40-60 minutos
- Objetivo: Entender y mantener código

### 📊 Architect / Lead
- Necesita: **DIAGNOSTICO** + **SOLUCION**
- Tiempo: 60-90 minutos
- Objetivo: Entender completamente y diseñar futuro

### 👔 Manager / Stakeholder
- Solo necesita: **RESUMEN_SOLUCION_FOTOS.md**
- Tiempo: 5 minutos
- Objetivo: Resumen ejecutivo

---

## 🚦 GUÍA DE SEMÁFOROS

### 🟢 Verde (Todo OK)
- La app funciona
- Fotos se suben sin crash
- Logs muestran ✅ mensajes
- Todos los tests pasan

### 🟡 Amarillo (Revisar)
- App funciona pero lenta
- Algunos logs ⚠️ aparecen
- Algunos tests pasan, otros fallan
- Necesita ajustes de rendimiento

### 🔴 Rojo (Problema)
- App sigue crasheando
- Logs muestran ❌ mensajes
- Tests fallan completamente
- Necesita más debugging

**Si ves rojo**: Abre [INSTALACION_SOLUCION_FOTOS.md](INSTALACION_SOLUCION_FOTOS.md) - Solución de Problemas

---

**¡Ya sabes qué leer! Adelante! 🚀**
