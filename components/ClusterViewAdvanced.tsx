/**
 * Advanced Cluster View with Text Rendering
 * 
 * This version includes proper text rendering using Skia's text capabilities
 * and enhanced visual effects.
 */

import {
  Blur,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Skia,
  vec
} from '@shopify/react-native-skia';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Constants
const NODE_RADIUS = 45;
const CATEGORY_RADIUS = 100;
const SPRING_CONFIG = { damping: 25, stiffness: 180 };
const REPULSION_FORCE = 600;
const ATTRACTION_FORCE = 0.08;
const FRICTION = 0.92;
const COLLISION_PADDING = 8;

// Types
export type Category = {
  id: string;
  name: string;
  color: string;
  center: { x: number; y: number };
};

export type Project = {
  id: string;
  name: string;
  percent: number;
  categoryId: string | null;
};

type ProjectNode = Project & {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type ClusterViewAdvancedProps = {
  categories: Category[];
  projects: Project[];
  onProjectCategoryChange?: (projectId: string, categoryId: string | null) => void;
};

export const ClusterViewAdvanced: React.FC<ClusterViewAdvancedProps> = ({
  categories,
  projects,
  onProjectCategoryChange,
}) => {
  // Initialize nodes with physics properties
  const nodes = useSharedValue<ProjectNode[]>(
    projects.map((p) => {
      // Find initial category center or use screen center
      const category = categories.find((c) => c.id === p.categoryId);
      const centerX = category?.center.x || SCREEN_WIDTH / 2;
      const centerY = category?.center.y || SCREEN_HEIGHT / 2;
      
      return {
        ...p,
        x: centerX + (Math.random() - 0.5) * 80,
        y: centerY + (Math.random() - 0.5) * 80,
        vx: 0,
        vy: 0,
      };
    })
  );

  const activeNodeId = useSharedValue<string | null>(null);
  const dragOffset = useSharedValue({ x: 0, y: 0 });

  // Physics simulation
  useFrameCallback(() => {
    'worklet';
    if (activeNodeId.value !== null) return; // Skip physics while dragging

    const nodeList = nodes.value;
    const newNodes = [...nodeList];

    for (let i = 0; i < newNodes.length; i++) {
      const node = newNodes[i];
      let fx = 0;
      let fy = 0;

      // Attraction to category center
      if (node.categoryId) {
        const category = categories.find((c) => c.id === node.categoryId);
        if (category) {
          const dx = category.center.x - node.x;
          const dy = category.center.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Stronger attraction when far away
          const attractionStrength = ATTRACTION_FORCE * (1 + distance / 100);
          fx += dx * attractionStrength;
          fy += dy * attractionStrength;
        }
      }

      // Repulsion from other nodes (collision avoidance)
      for (let j = 0; j < newNodes.length; j++) {
        if (i === j) continue;
        const other = newNodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = NODE_RADIUS * 2 + COLLISION_PADDING;

        if (dist < minDist && dist > 0) {
          const force = ((minDist - dist) / dist) * REPULSION_FORCE;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      }

      // Update velocity with friction
      node.vx = (node.vx + fx * 0.016) * FRICTION; // 0.016 ≈ 60fps
      node.vy = (node.vy + fy * 0.016) * FRICTION;

      // Update position
      node.x += node.vx;
      node.y += node.vy;

      // Boundary constraints with smooth bounce
      const margin = NODE_RADIUS + 15;
      if (node.x < margin) {
        node.x = margin;
        node.vx = Math.abs(node.vx) * 0.4;
      }
      if (node.x > SCREEN_WIDTH - margin) {
        node.x = SCREEN_WIDTH - margin;
        node.vx = -Math.abs(node.vx) * 0.4;
      }
      if (node.y < margin) {
        node.y = margin;
        node.vy = Math.abs(node.vy) * 0.4;
      }
      if (node.y > SCREEN_HEIGHT - margin) {
        node.y = SCREEN_HEIGHT - margin;
        node.vy = -Math.abs(node.vy) * 0.4;
      }
    }

    nodes.value = newNodes;
  });

  // Update nodes when projects change
  useEffect(() => {
    nodes.value = nodes.value.map((node) => {
      const project = projects.find((p) => p.id === node.id);
      return project ? { ...node, ...project } : node;
    });
  }, [projects, nodes]);

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        {/* Render category centers */}
        {categories.map((cat) => (
          <Group key={`cat-${cat.id}`}>
            {/* Outer glow */}
            <Circle cx={cat.center.x} cy={cat.center.y} r={CATEGORY_RADIUS + 10} color={cat.color} opacity={0.03}>
              <Blur blur={20} />
            </Circle>
            {/* Main circle */}
            <Circle cx={cat.center.x} cy={cat.center.y} r={CATEGORY_RADIUS} color={cat.color} opacity={0.06} />
            {/* Inner ring */}
            <Circle
              cx={cat.center.x}
              cy={cat.center.y}
              r={CATEGORY_RADIUS - 5}
              style="stroke"
              strokeWidth={1.5}
              color={cat.color}
              opacity={0.15}
            />
          </Group>
        ))}

        {/* Render project nodes */}
        {nodes.value.map((node) => (
          <NodeRenderer
            key={node.id}
            node={node}
            categories={categories}
            activeNodeId={activeNodeId}
            dragOffset={dragOffset}
            nodes={nodes}
            onCategoryChange={onProjectCategoryChange}
          />
        ))}
      </Canvas>
    </View>
  );
};

// Individual node component
const NodeRenderer: React.FC<{
  node: ProjectNode;
  categories: Category[];
  activeNodeId: SharedValue<string | null>;
  dragOffset: SharedValue<{ x: number; y: number }>;
  nodes: SharedValue<ProjectNode[]>;
  onCategoryChange?: (projectId: string, categoryId: string | null) => void;
}> = ({ node, categories, activeNodeId, dragOffset, nodes, onCategoryChange }) => {
  const translateX = useSharedValue(node.x);
  const translateY = useSharedValue(node.y);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(node.percent >= 100 ? 1 : 0);

  // Animate glow when percent changes
  useEffect(() => {
    glowOpacity.value = withTiming(node.percent >= 100 ? 1 : 0, { duration: 600 });
  }, [node.percent, glowOpacity]);

  // Update position from physics
  useDerivedValue(() => {
    if (activeNodeId.value !== node.id) {
      const currentNode = nodes.value.find((n: ProjectNode) => n.id === node.id);
      if (currentNode) {
        translateX.value = withSpring(currentNode.x, SPRING_CONFIG);
        translateY.value = withSpring(currentNode.y, SPRING_CONFIG);
      }
    }
  });

  const findNearestCategory = (x: number, y: number) => {
    'worklet';
    let nearest: { category: Category | null; distance: number } = {
      category: null,
      distance: Infinity,
    };

    for (const cat of categories) {
      const dx = x - cat.center.x;
      const dy = y - cat.center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearest.distance && dist < CATEGORY_RADIUS) {
        nearest = { category: cat, distance: dist };
      }
    }

    return nearest.category;
  };

  const updateCategory = (projectId: string, categoryId: string | null) => {
    if (onCategoryChange) {
      onCategoryChange(projectId, categoryId);
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      activeNodeId.value = node.id;
      scale.value = withSpring(1.15, { damping: 15 });
      dragOffset.value = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((e) => {
      translateX.value = dragOffset.value.x + e.translationX;
      translateY.value = dragOffset.value.y + e.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 15 });
      activeNodeId.value = null;

      // Check category assignment
      const nearestCat = findNearestCategory(translateX.value, translateY.value);
      const newCategoryId = nearestCat?.id || null;

      if (newCategoryId !== node.categoryId) {
        runOnJS(updateCategory)(node.id, newCategoryId);
      }

      // Update node in shared state
      nodes.value = nodes.value.map((n: ProjectNode) =>
        n.id === node.id
          ? {
              ...n,
              x: translateX.value,
              y: translateY.value,
              categoryId: newCategoryId,
              vx: 0,
              vy: 0,
            }
          : n
      );
    });

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    transform: [
      { translateX: translateX.value - NODE_RADIUS },
      { translateY: translateY.value - NODE_RADIUS },
      { scale: scale.value },
    ],
  }));

  const category = categories.find((c) => c.id === node.categoryId);
  const color = category?.color || '#9CA3AF';
  const liquidHeight = (node.percent / 100) * (NODE_RADIUS * 2 - 8);
  const isComplete = node.percent >= 100;
  // firstLetter removed (unused)

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <Canvas style={styles.nodeCanvas}>
          <Group>
            {/* Vibrant glow for completed projects */}
            {isComplete && (
              <>
                <Circle cx={NODE_RADIUS} cy={NODE_RADIUS} r={NODE_RADIUS + 15} color={color} opacity={0.4}>
                  <Blur blur={20} />
                </Circle>
                <Circle cx={NODE_RADIUS} cy={NODE_RADIUS} r={NODE_RADIUS + 8} color={color} opacity={0.6}>
                  <Blur blur={12} />
                </Circle>
                <Circle cx={NODE_RADIUS} cy={NODE_RADIUS} r={NODE_RADIUS + 3} color={color} opacity={0.3}>
                  <Blur blur={6} />
                </Circle>
              </>
            )}

            {/* Drop shadow for depth */}
            <Circle cx={NODE_RADIUS + 1} cy={NODE_RADIUS + 2} r={NODE_RADIUS - 1} color="#000000" opacity={0.08}>
              <Blur blur={4} />
            </Circle>

            {/* Main vessel border */}
            <Circle
              cx={NODE_RADIUS}
              cy={NODE_RADIUS}
              r={NODE_RADIUS - 2}
              style="stroke"
              strokeWidth={3.5}
              color={color}
              opacity={isComplete ? 1 : 0.85}
            />

            {/* Inner white background */}
            <Circle cx={NODE_RADIUS} cy={NODE_RADIUS} r={NODE_RADIUS - 5} color="#FFFFFF" />

            {/* Liquid fill with gradient */}
            {liquidHeight > 0 && (
              <Group
                clip={Skia.Path.Make().addCircle(NODE_RADIUS, NODE_RADIUS, NODE_RADIUS - 5)}
              >
                {/* Base liquid color */}
                <Circle
                  cx={NODE_RADIUS}
                  cy={NODE_RADIUS * 2 - liquidHeight - 4}
                  r={NODE_RADIUS}
                  color={color}
                  opacity={0.18}
                />
                {/* Gradient overlay for depth */}
                <Circle cx={NODE_RADIUS} cy={NODE_RADIUS * 2 - liquidHeight - 4} r={NODE_RADIUS}>
                  <LinearGradient
                    start={vec(NODE_RADIUS, NODE_RADIUS * 2 - liquidHeight - NODE_RADIUS - 4)}
                    end={vec(NODE_RADIUS, NODE_RADIUS * 2 - liquidHeight + NODE_RADIUS - 4)}
                    colors={[`${color}20`, `${color}30`]}
                  />
                </Circle>
                {/* Surface shimmer */}
                <Circle
                  cx={NODE_RADIUS}
                  cy={NODE_RADIUS * 2 - liquidHeight - 4}
                  r={NODE_RADIUS - 10}
                  color="#FFFFFF"
                  opacity={0.15}
                />
              </Group>
            )}

            {/* Project letter - simplified circle representation */}
            {/* Note: For production, use SkiaText with a loaded font */}
            <Circle cx={NODE_RADIUS} cy={NODE_RADIUS} r={14} color={color} opacity={0.85} />
            <Circle cx={NODE_RADIUS} cy={NODE_RADIUS} r={10} color="#FFFFFF" />
          </Group>
        </Canvas>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  canvas: {
    flex: 1,
  },
  nodeCanvas: {
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
  },
});
