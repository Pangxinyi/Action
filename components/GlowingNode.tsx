/**
 * GlowingNode - High-quality Skia-powered glowing orb
 * Implements multi-layer blur and radial gradients for neon/energy effect
 */

import { Blur, Canvas, Circle, Group, RadialGradient, vec } from '@shopify/react-native-skia';
import React, { useEffect } from 'react';
import { useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface GlowingNodeProps {
  x: number;
  y: number;
  size: number;
  color: string;
  isGlowing: boolean; // true when project is 100%
  percent?: number; // for liquid fill effect
  label?: string;
}

export const GlowingNode: React.FC<GlowingNodeProps> = ({
  x,
  y,
  size,
  color,
  isGlowing,
  percent = 0,
  label = '',
}) => {
  // Animated pulse for glow effect
  const pulseValue = useSharedValue(0);

  useEffect(() => {
    if (isGlowing) {
      pulseValue.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1, // infinite
        true // reverse
      );
    } else {
      pulseValue.value = 0;
    }
  }, [isGlowing]);

  // Breathing blur radius (25px to 35px)
  const outerBlurRadius = useDerivedValue(() => {
    return isGlowing ? 25 + pulseValue.value * 10 : 0;
  });

  const innerBlurRadius = useDerivedValue(() => {
    return isGlowing ? 10 + pulseValue.value * 5 : 0;
  });

  // Opacity pulsing
  const glowOpacity = useDerivedValue(() => {
    return isGlowing ? 0.3 + pulseValue.value * 0.2 : 0;
  });

  const radius = size / 2;

  return (
    <Canvas style={{ width: size * 3, height: size * 3 }}>
      <Group>
        {/* Layer 1: Outermost ambient glow (largest blur) */}
        {isGlowing && (
          <Circle cx={size * 1.5} cy={size * 1.5} r={radius + 20} color={color} opacity={glowOpacity}>
            <Blur blur={outerBlurRadius} />
          </Circle>
        )}

        {/* Layer 2: Middle glow (medium blur, higher opacity) */}
        {isGlowing && (
          <Circle cx={size * 1.5} cy={size * 1.5} r={radius + 10} color={color} opacity={0.6}>
            <Blur blur={innerBlurRadius} />
          </Circle>
        )}

        {/* Layer 3: Inner core glow (tight blur, intense) */}
        {isGlowing && (
          <Circle cx={size * 1.5} cy={size * 1.5} r={radius + 5} color={color} opacity={0.8}>
            <Blur blur={5} />
          </Circle>
        )}

        {/* Main Node Body with Radial Gradient (glass/liquid effect) */}
        <Circle cx={size * 1.5} cy={size * 1.5} r={radius}>
          <RadialGradient
            c={vec(size * 1.5, size * 1.5)}
            r={radius}
            colors={[
              `${color}FF`, // Full opacity at center
              `${color}E6`, // 90% at mid
              `${color}CC`, // 80% at edge (translucent rim)
            ]}
          />
        </Circle>

        {/* Liquid Fill Effect (darker overlay) */}
        {percent > 0 && (
          <Group>
            <Circle
              cx={size * 1.5}
              cy={size * 1.5 + radius - (percent / 100) * (radius * 2)}
              r={radius}
              color="rgba(0, 0, 0, 0.15)"
            />
          </Group>
        )}

        {/* White Border for definition */}
        <Circle cx={size * 1.5} cy={size * 1.5} r={radius} style="stroke" strokeWidth={2} color="#FFFFFF" />
      </Group>
    </Canvas>
  );
};
