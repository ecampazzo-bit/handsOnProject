#!/bin/bash
# Script para ejecutar Expo en Android sin prompt de login - procede automáticamente como anónimo
export CI=true
npx expo start --android --non-interactive "$@"
