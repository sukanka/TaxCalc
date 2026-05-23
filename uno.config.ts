import { defineConfig, presetUno, presetIcons, presetTypography } from 'unocss';

export default defineConfig({
  presets: [presetUno(), presetIcons(), presetTypography()],
  theme: {
    colors: {
      primary: '#4f46e5',
      warn: '#f59e0b',
      danger: '#dc2626',
      success: '#10b981',
      bg: '#fafaf9',
      ink: '#1c1917',
      mute: '#78716c',
    },
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
      mono: '"SF Mono", Menlo, Consolas, monospace',
    },
  },
  shortcuts: {
    'card': 'bg-white rounded-12px shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-16px',
    'btn-primary': 'bg-primary text-white px-16px py-8px rounded-8px hover:opacity-90 transition',
  },
});
