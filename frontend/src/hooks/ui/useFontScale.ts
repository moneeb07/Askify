import { useCallback, useEffect, useState } from 'react';

const UI_SCALE_DEFAULT = 1;
const UI_SCALE_MIN = 0.8;
const UI_SCALE_MAX = 1.3;
const UI_SCALE_STEP = 0.05;

export const FONT_SCALE_DEFAULT = UI_SCALE_DEFAULT;
export const FONT_SCALE_MIN = UI_SCALE_MIN;
export const FONT_SCALE_MAX = UI_SCALE_MAX;
export const FONT_SCALE_STEP = UI_SCALE_STEP;

const STORAGE_KEY = 'ui-font-scale';

// Clamp UI scale to allowed range
const clampFontScale = (value: number) => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return FONT_SCALE_DEFAULT;
  }
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, value));
};

const useFontScale = (): [number, (scale: number) => Promise<void>] => {
  const [fontScale, setFontScaleState] = useState(FONT_SCALE_DEFAULT);

  // Read saved scale from localStorage on mount
  const fetchZoomFactor = useCallback(async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = parseFloat(saved);
        const clamped = clampFontScale(parsed);
        setFontScaleState(clamped);
        document.documentElement.style.fontSize = `${clamped * 100}%`;
      }
    } catch (error) {
      console.error('Failed to fetch zoom factor:', error);
    }
  }, []);

  useEffect(() => {
    void fetchZoomFactor();
  }, [fetchZoomFactor]);

  // Optimistically update state, persist to localStorage, apply to DOM
  const setFontScale = useCallback(
    async (nextScale: number) => {
      const clamped = clampFontScale(nextScale);
      setFontScaleState(clamped);
      try {
        localStorage.setItem(STORAGE_KEY, String(clamped));
        document.documentElement.style.fontSize = `${clamped * 100}%`;
      } catch (error) {
        console.error('Failed to set zoom factor:', error);
        void fetchZoomFactor();
      }
    },
    [fetchZoomFactor]
  );

  return [fontScale, setFontScale];
};

export { clampFontScale };
export default useFontScale;