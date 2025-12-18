import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { colors } from './src/constants/colors';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <AuthNavigator />
    </>
  );
}





