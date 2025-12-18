import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

interface ServiceCardProps {
  serviceName: string;
  isSelected: boolean;
  onToggle: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  serviceName,
  isSelected,
  onToggle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
          {serviceName}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 8,
  },
  cardSelected: {
    backgroundColor: colors.primaryLight + '15',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  serviceName: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  serviceNameSelected: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
});





