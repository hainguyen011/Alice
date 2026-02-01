/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0c0d12',
                surface: '#12141d',
                card: '#1a1d29',
                primary: {
                    DEFAULT: '#ff3e3e',
                    hover: '#ff5555',
                    glow: 'rgba(255, 62, 62, 0.4)',
                },
                success: '#00ffd1',
                info: '#00d1ff',
                muted: '#808695',
                border: 'rgba(255, 255, 255, 0.08)',
            },
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
                jakarta: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
            },
            backdropBlur: {
                '2xl': '20px',
            },
        },
    },
    plugins: [],
}
