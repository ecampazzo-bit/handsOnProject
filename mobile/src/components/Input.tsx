import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
  Platform,
} from 'react-native';
import { colors } from '../constants/colors';

interface InputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  icon,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  style,
  multiline = false,
  numberOfLines = 1,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    // En iOS, mantener el foco después de cambiar secureTextEntry
    if (Platform.OS === 'ios' && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Configuración específica para iOS con campos de contraseña
  const passwordProps = secureTextEntry && Platform.OS === 'ios'
    ? {
        textContentType: 'password' as const,
        passwordRules: 'required: lower; required: upper; required: digit; max-consecutive: 2;',
      }
    : {};

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          isFocused ? styles.inputContainerFocused : undefined,
          error ? styles.inputContainerError : undefined,
          style,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            icon ? styles.inputWithIcon : undefined,
            multiline ? styles.inputMultiline : undefined,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={true}
          {...passwordProps}
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 12,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputMultiline: {
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIconText: {
    fontSize: 18,
  },
  errorText: {
    color: colors.error,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
});


