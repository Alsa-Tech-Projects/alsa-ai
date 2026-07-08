import { useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type AccentColor = 'blue' | 'purple' | 'green' | 'red' | 'orange';
export type FontSize = 'small' | 'medium' | 'large';

export interface ThemeSettings {
  mode: ThemeMode;
  accent: AccentColor;
  fontSize: FontSize;
}

const STORAGE_KEY = 'alsa_theme_settings';

// Accent color HSL values for both light and dark modes
const ACCENT_COLORS: Record<AccentColor, { primary: string; glow: string; ring: string }> = {
  blue:   { primary: '217 91% 60%',  glow: '221 83% 65%', ring: '217 91% 60%' },
  purple: { primary: '262 83% 65%',  glow: '270 80% 70%', ring: '262 83% 65%' },
  green:  { primary: '142 71% 45%',  glow: '142 70% 55%', ring: '142 71% 45%' },
  red:    { primary: '0 84% 60%',    glow: '0 80% 65%',   ring: '0 84% 60%'   },
  orange: { primary: '25 95% 53%',   glow: '30 95% 60%',  ring: '25 95% 53%'  },
};

const FONT_SIZE_PX: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

const DEFAULTS: ThemeSettings = { mode: 'dark', accent: 'blue', fontSize: 'medium' };

export const loadThemeSettings = (): ThemeSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
};

export const applyThemeSettings = (s: ThemeSettings) => {
  const root = document.documentElement;

  // 1) Mode
  const isDark =
    s.mode === 'dark' ||
    (s.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', isDark);

  // 2) Accent color → primary CSS vars
  const c = ACCENT_COLORS[s.accent] || ACCENT_COLORS.blue;
  root.style.setProperty('--primary', c.primary);
  root.style.setProperty('--primary-glow', c.glow);
  root.style.setProperty('--ring', c.ring);

  // 3) Font size base
  root.style.fontSize = FONT_SIZE_PX[s.fontSize] || FONT_SIZE_PX.medium;
};

export const saveThemeSettings = (s: ThemeSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  applyThemeSettings(s);
  window.dispatchEvent(new CustomEvent('alsa-theme-change', { detail: s }));
};

export const useTheme = () => {
  const [settings, setSettings] = useState<ThemeSettings>(loadThemeSettings);

  useEffect(() => {
    applyThemeSettings(settings);
  }, []);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as ThemeSettings;
      if (detail) setSettings(detail);
    };
    window.addEventListener('alsa-theme-change', onChange);
    return () => window.removeEventListener('alsa-theme-change', onChange);
  }, []);

  const update = useCallback((patch: Partial<ThemeSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveThemeSettings(next);
      return next;
    });
  }, []);

  return { settings, update };
};

// Apply on app boot before React renders, to avoid flash
export const initThemeOnBoot = () => {
  applyThemeSettings(loadThemeSettings());
};
