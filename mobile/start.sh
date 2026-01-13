#!/bin/bash
# Script para ejecutar Expo sin prompt de login
export CI=true
npx expo start "$@"
