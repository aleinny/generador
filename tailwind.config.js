/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de colores personalizada para pensiones
        pension: {
          primary: '#1e40af',    // Azul principal
          secondary: '#7c3aed',  // Púrpura
          success: '#059669',    // Verde
          danger: '#dc2626',     // Rojo
          warning: '#d97706',    // Naranja
          info: '#0284c7',       // Azul claro
        },
        // Gradientes personalizados
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse-slow 3s infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fadeInUp': 'fadeInUp 0.5s ease-out',
      },
      boxShadow: {
        'custom': '0 4px 6px -1px rgba(171, 77, 77, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'custom-lg': '0 10px 15px -3px rgba(78, 178, 48, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
