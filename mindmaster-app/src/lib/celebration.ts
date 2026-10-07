import confetti from "canvas-confetti";

/**
 * Triggers a vibrant, celebratory confetti cannon burst
 * Custom tailored with MindMaster Royal Blue (#0B57D0) and Gold (#F59E0B) colors
 */
export function triggerCourseUnlockConfetti() {
  if (typeof window === "undefined") return;

  // Multi-stage fireworks explosion
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ["#0B57D0", "#3B82F6", "#F59E0B", "#10B981", "#8B5CF6"],
    zIndex: 9999,
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });

  fire(0.2, {
    spread: 60,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}
