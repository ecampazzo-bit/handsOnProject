# Solución para "Could not connect to development server"

## Pasos para resolver el problema:

### 1. Detener todos los procesos
```bash
cd /Users/ecampazzo/Documents/Dev/handsOnProject/mobile
pkill -f "expo start"
pkill -f "metro"
```

### 2. Limpiar cache y reinstalar
```bash
rm -rf node_modules
rm -rf .expo
rm package-lock.json
npm install --legacy-peer-deps
```

### 3. Iniciar con modo tunnel (recomendado)
```bash
npx expo start --clear --tunnel
```

### 4. Alternativa: Modo LAN (más rápido, requiere misma WiFi)
```bash
npx expo start --clear --lan
```

### 5. Si el problema persiste, verifica:

#### A. Variables de entorno
Asegúrate de que el archivo `.env` existe y tiene:
```
EXPO_PUBLIC_SUPABASE_URL=https://kqxnjpyupcxbajuzsbtx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0
```

#### B. Red WiFi
- Tu celular y computadora deben estar en la misma red WiFi
- Si usas VPN, desactívala temporalmente
- Prueba con modo `--tunnel` que funciona sin importar la red

#### C. Firewall
En macOS, permite conexiones entrantes para Node.js:
```bash
# Verificar si hay bloqueos
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps
```

#### D. Puerto ocupado
Si el puerto 8081 está ocupado:
```bash
lsof -ti:8081 | xargs kill -9
```

### 6. Verificar que el servidor está corriendo
```bash
curl http://localhost:8081/status
# Debería responder: packager-status:running
```

### 7. Probar en web primero
Para verificar que el código funciona:
```bash
npx expo start --web
```

## Comandos rápidos:

```bash
# Reinicio completo
cd /Users/ecampazzo/Documents/Dev/handsOnProject/mobile
pkill -f expo && pkill -f metro
npx expo start --clear --tunnel
```

## Si nada funciona:

1. Cierra Expo Go completamente en tu celular
2. Reinicia el servidor
3. Abre Expo Go de nuevo
4. Escanea el nuevo código QR

