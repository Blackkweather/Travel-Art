/**
 * GSAP optimization utilities
 * Improves animation performance
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Optimize GSAP animations for better performance
 */
export function optimizeGSAP() {
  // Use will-change for better GPU acceleration
  gsap.config({
    force3D: true, // Force 3D transforms for GPU acceleration
    nullTargetWarn: false,
  });

  // Optimize ScrollTrigger defaults
  ScrollTrigger.config({
    autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
    ignoreMobileResize: true, // Ignore mobile resize for better performance
  });
}

/**
 * Create optimized GSAP animation with performance settings
 */
export function createOptimizedAnimation(
  target: gsap.TweenTarget,
  vars: gsap.TweenVars
): gsap.core.Tween {
  return gsap.to(target, {
    ...vars,
    force3D: true, // GPU acceleration
    lazy: false, // Don't wait for layout
  });
}

/**
 * Batch GSAP animations for better performance
 */
export function batchAnimations(
  animations: Array<() => gsap.core.Tween>
): gsap.core.Timeline {
  const tl = gsap.timeline();
  animations.forEach((anim) => anim());
  return tl;
}

/**
 * Cleanup ScrollTrigger instances
 */
export function cleanupScrollTriggers() {
  ScrollTrigger.getAll().forEach((trigger) => {
    trigger.kill();
  });
}

/**
 * Refresh ScrollTrigger after layout changes
 */
export function refreshScrollTrigger() {
  ScrollTrigger.refresh();
}






