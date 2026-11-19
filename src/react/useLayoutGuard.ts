import { useEffect, useRef } from 'react';
import type { FluidConfig } from '../core/types.js';

export interface LayoutGuardOptions {
  /**
   * Explicitly enable or disable layout inspections.
   * Defaults to true in development, false in production.
   */
  enabled?: boolean;

  /**
   * Minimum touch target size in pixels.
   * @default 44
   */
  minTouchTargetSize?: number;

  /**
   * Viewport width threshold in pixels below which touch-target checks are enforced.
   * Defaults to config.minViewport or 480.
   */
  touchTargetViewportThreshold?: number;

  /**
   * Configuration options for fluid scaling.
   */
  config?: FluidConfig;

  /**
   * Whether to log warnings to the browser console.
   * @default true
   */
  warnInConsole?: boolean;
}

/**
 * React hook that inspects layouts in development mode for horizontal overflow
 * and undersized touch targets on mobile viewports.
 *
 * Automatically no-ops during SSR and production builds.
 */
export function useLayoutGuard(
  enabledOrOptions?: boolean | LayoutGuardOptions
): void {
  const options: LayoutGuardOptions =
    typeof enabledOrOptions === 'boolean'
      ? { enabled: enabledOrOptions }
      : (enabledOrOptions ?? {});

  const isDev =
    typeof process !== 'undefined' && process.env?.NODE_ENV !== undefined
      ? process.env.NODE_ENV !== 'production'
      : true;

  const isEnabled = options.enabled ?? isDev;
  const minTouchSize = options.minTouchTargetSize ?? 44;
  const touchViewportThreshold =
    options.touchTargetViewportThreshold ?? options.config?.minViewport ?? 480;
  const warnInConsole = options.warnInConsole ?? true;

  const warnedOverflowRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const checkLayout = () => {
      const docEl = document.documentElement;
      const windowWidth = window.innerWidth || docEl.clientWidth;
      const scrollWidth = docEl.scrollWidth;

      // 1. Horizontal Overflow Detection (allowing 1px subpixel tolerance)
      if (scrollWidth > windowWidth + 1) {
        if (!docEl.hasAttribute('data-fluid-overflow')) {
          docEl.setAttribute('data-fluid-overflow', 'true');
        }

        const allElements = document.body?.querySelectorAll<HTMLElement>('*') ?? [];
        const culprits: HTMLElement[] = [];

        allElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (
            rect.right > windowWidth + 1 ||
            (el.scrollWidth > el.clientWidth && el.scrollWidth > windowWidth)
          ) {
            if (!el.hasAttribute('data-fluid-overflow-culprit')) {
              el.setAttribute('data-fluid-overflow-culprit', 'true');
            }
            culprits.push(el);
          } else if (el.hasAttribute('data-fluid-overflow-culprit')) {
            el.removeAttribute('data-fluid-overflow-culprit');
          }
        });

        if (warnInConsole && !warnedOverflowRef.current) {
          console.warn(
            `[fluid-scale] Layout overflow detected: document.scrollWidth (${scrollWidth}px) exceeds viewport (${windowWidth}px). Offending elements:`,
            culprits
          );
          warnedOverflowRef.current = true;
        }
      } else {
        if (docEl.hasAttribute('data-fluid-overflow')) {
          docEl.removeAttribute('data-fluid-overflow');
        }
        document.querySelectorAll('[data-fluid-overflow-culprit]').forEach((el) => {
          el.removeAttribute('data-fluid-overflow-culprit');
        });
        warnedOverflowRef.current = false;
      }

      // 2. Touch Target Accessibility Check (on mobile/narrow viewports)
      if (windowWidth <= touchViewportThreshold) {
        const interactiveElements = document.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
        );

        interactiveElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return;

          if (rect.width < minTouchSize || rect.height < minTouchSize) {
            if (el.getAttribute('data-fluid-touch-target') !== 'too-small') {
              el.setAttribute('data-fluid-touch-target', 'too-small');
            }
          } else if (el.hasAttribute('data-fluid-touch-target')) {
            el.removeAttribute('data-fluid-touch-target');
          }
        });
      } else {
        document.querySelectorAll('[data-fluid-touch-target]').forEach((el) => {
          el.removeAttribute('data-fluid-touch-target');
        });
      }
    };

    checkLayout();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      observer = new ResizeObserver(() => {
        checkLayout();
      });
      observer.observe(document.body);
    }

    window.addEventListener('resize', checkLayout, { passive: true });

    return () => {
      if (observer) {
        observer.disconnect();
      }
      window.removeEventListener('resize', checkLayout);

      if (document.documentElement.hasAttribute('data-fluid-overflow')) {
        document.documentElement.removeAttribute('data-fluid-overflow');
      }
      document.querySelectorAll('[data-fluid-overflow-culprit]').forEach((el) => {
        el.removeAttribute('data-fluid-overflow-culprit');
      });
      document.querySelectorAll('[data-fluid-touch-target]').forEach((el) => {
        el.removeAttribute('data-fluid-touch-target');
      });
    };
  }, [isEnabled, minTouchSize, touchViewportThreshold, warnInConsole]);
}
