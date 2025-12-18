import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getCurrentUser, saveUserServices } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { SERVICIOS, Service, searchServices } from '../constants/services';
import { ServiceCard } from '../components/ServiceCard';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { RootStackParamList } from '../types/navigation';

type ServiceSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ServiceSelection'
>;

export const ServiceSelectionScreen: React.FC = () => {
  const navigation = useNavigation<ServiceSelectionScreenNavigationProp>();
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(SERVICIOS))
  );
  const [loading, setLoading] = useState(false);

  // Verificar sesión al montar el componente (opcional, la función RPC maneja el registro inicial)
  React.useEffect(() => {
    const checkSession = async () => {
      const { user, error } = await getCurrentUser();
      if (error || !user) {
        console.warn('Advertencia: No se pudo verificar sesión en ServiceSelection:', error);
        // No bloquear, la función RPC puede manejar el registro inicial
      } else {
        console.log('Sesión verificada en ServiceSelection:', user.id);
      }
    };
    checkSession();
  }, [navigation]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleService = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) {
      return SERVICIOS;
    }

    const searchResults = searchServices(searchQuery);
    const filtered: Record<string, string[]> = {};

    searchResults.forEach((service) => {
      if (!filtered[service.category]) {
        filtered[service.category] = [];
      }
      if (!filtered[service.category].includes(service.name)) {
        filtered[service.category].push(service.name);
      }
    });

    return filtered;
  }, [searchQuery]);

  const getServiceId = (category: string, serviceName: string): string => {
    return `${category}-${serviceName}`;
  };

  const handleSave = async () => {
    if (selectedServices.size === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos un servicio');
      return;
    }

    setLoading(true);
    try {
      // Intentar obtener el userId de la sesión de Supabase Auth primero
      // Esto funciona incluso durante el registro inicial
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      let userId: string | null = null;

      if (session?.user?.id) {
        userId = session.user.id;
        console.log('UserId obtenido de la sesión:', userId);
      } else {
        // Si no hay sesión, intentar obtener el usuario actual
        const { user, error: userError } = await getCurrentUser();
        if (userError || !user) {
          Alert.alert('Error', 'No se pudo obtener la información del usuario. Por favor, intenta iniciar sesión nuevamente.');
          setLoading(false);
          return;
        }
        userId = user.id;
        console.log('UserId obtenido de getCurrentUser:', userId);
      }

      if (!userId) {
        Alert.alert('Error', 'No se pudo obtener el ID del usuario');
        setLoading(false);
        return;
      }

      const servicesToSave: Array<{ nombre: string; categoria: string }> = [];

      selectedServices.forEach((serviceId) => {
        const [category, ...serviceNameParts] = serviceId.split('-');
        const serviceName = serviceNameParts.join('-');
        servicesToSave.push({
          nombre: serviceName,
          categoria: category,
        });
      });

      console.log('Guardando servicios para userId:', userId);
      const { error } = await saveUserServices(userId, servicesToSave);

      if (error) {
        Alert.alert('Error', error.message || 'No se pudieron guardar los servicios');
        return;
      }

      Alert.alert('Éxito', 'Servicios guardados correctamente', [
        {
          text: 'OK',
          onPress: () => {
            // TODO: Navegar a HomeScreen
            navigation.navigate('Login');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Selecciona tus servicios</Text>
        <Text style={styles.subtitle}>
          Selecciona todos los servicios que ofreces ({selectedServices.size} seleccionados)
        </Text>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar servicios..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textLight}
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {Object.keys(filteredServices).map((category) => (
          <View key={category} style={styles.categoryContainer}>
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => toggleCategory(category)}
            >
              <Text style={styles.categoryTitle}>{category}</Text>
              <Text style={styles.expandIcon}>
                {expandedCategories.has(category) ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {expandedCategories.has(category) && (
              <View style={styles.servicesContainer}>
                {filteredServices[category].map((serviceName) => {
                  const serviceId = getServiceId(category, serviceName);
                  return (
                    <ServiceCard
                      key={serviceId}
                      serviceName={serviceName}
                      isSelected={selectedServices.has(serviceId)}
                      onToggle={() => toggleService(serviceId)}
                    />
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={`Guardar y Continuar (${selectedServices.size})`}
          onPress={handleSave}
          loading={loading}
          disabled={selectedServices.size === 0}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  searchIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryDark,
    flex: 1,
  },
  expandIcon: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  servicesContainer: {
    paddingLeft: 8,
  },
  footer: {
    padding: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});




