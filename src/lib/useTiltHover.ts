import * as React from "react";

/**
 * Cursor-following 3D tilt + lift animation for card-shaped elements.
 *
 * Adapted from the math in the InteractiveProductCard reference the user
 * shared (`card-7.tsx`). Only the *motion* is extracted — none of the
 * reference component's visual design (gradient overlays, glassmorphism,
 * pagination dots, etc.) is brought along. Per user request: "Do not
 * modify any aspect of the design; simply add animation to the category
 * cards and the study cards contained within them."
 *
 * Behavior:
 *   - Cursor position is mapped relative to the element's center.
 *   - Element rotates up to ±8° around the X and Y axes proportional to
 *     how far the cursor sits from center.
 *   - Element scales to 1.05 to give a subtle "lift" feel.
 *   - Movement transition is 0.1s ease-out (fast follow); return-to-rest
 *     transition is 0.4s ease-in-out (smooth release on mouse leave).
 *
 * Respects `prefers-reduced-motion: reduce` — returns the same handlers
 * but they no-op, so users who disable animations see a still card.
 *
 * Touch is implicitly safe: `onMouseMove` does not fire from touch input
 * on any platform, so phones/tablets show the card at rest. (And the
 * existing swipe-to-navigate gestures on study cards continue to work.)
 *
 * Usage:
 *   const tilt = useTiltHover<HTMLButtonElement>();
 *   return (
 *     <button
 *       ref={tilt.ref}
 *       style={tilt.style}
 *       onMouseMove={tilt.onMouseMove}
 *       onMouseLeave={tilt.onMouseLeave}
 *       ...
 *     >
 *   );
 */

const MAX_TILT_DEG = 8;
const HOVER_SCALE = 1.05;
const ENTER_TRANSITION = "transform 0.1s ease-out";
const LEAVE_TRANSITION = "transform 0.4s ease-in-out";
const NEUTRAL_TRANSFORM =
  "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";

export function useTiltHover<T extends HTMLElement = HTMLDivElement>() {
  const ref = React.useRef<T>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  // Captured once at mount. If a user toggles the OS-level preference
  // mid-session, the browser typically reloads the page anyway.
  const reducedMotion = React.useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const onMouseMove = React.useCallback(
    (e: React.MouseEvent<T>) => {
      if (reducedMotion || !ref.current) return;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      const rotateX = ((y - height / 2) / (height / 2)) * -MAX_TILT_DEG;
      const rotateY = ((x - width / 2) / (width / 2)) * MAX_TILT_DEG;
      setStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${HOVER_SCALE}, ${HOVER_SCALE}, ${HOVER_SCALE})`,
        transition: ENTER_TRANSITION,
      });
    },
    [reducedMotion],
  );

  const onMouseLeave = React.useCallback(() => {
    if (reducedMotion) return;
    setStyle({ transform: NEUTRAL_TRANSFORM, transition: LEAVE_TRANSITION });
  }, [reducedMotion]);

  return { ref, style, onMouseMove, onMouseLeave };
}
