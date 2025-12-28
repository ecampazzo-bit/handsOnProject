/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-blue-600',
    'bg-blue-700',
    'bg-red-600',
    'bg-red-700',
    'bg-green-600',
    'bg-green-700',
    'bg-yellow-600',
    'bg-yellow-700',
    'bg-gray-600',
    'bg-gray-700',
    'hover:bg-blue-700',
    'hover:bg-red-700',
    'hover:bg-green-700',
    'hover:bg-yellow-700',
    'hover:bg-gray-700',
    'text-white',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#10B981',
      },
    },
  },
  plugins: [],
}

