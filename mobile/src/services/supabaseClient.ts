import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Obtener variables de entorno - Expo las carga automáticamente desde .env
const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://kqxnjpyupcxbajuzsbtx.supabase.co';

const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_ztPj9JwZiHUO_CcW6VnSlA_BePbKtt0';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL:', supabaseUrl ? '✓' : '✗');
  console.error('Supabase Key:', supabaseAnonKey ? '✓' : '✗');
  throw new Error(
    'Faltan las variables de entorno EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

console.log('Configurando Supabase client:', {
  url: supabaseUrl.substring(0, 30) + '...',
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey?.substring(0, 20) + '...',
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-client-info': 'handson-app',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});


