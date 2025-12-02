import { Blur, Canvas, Circle, Group, LinearGradient, Paint, Skia, vec } from '@shopify/react-native-skia';
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
    withSpring
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Constants
const NODE_RADIUS = 40;
const CATEGORY_RADIUS = 80;
const SPRING_CONFIG = { damping: 20, stiffness: 150 };
const REPULSION_FORCE = 500;
const ATTRACTION_FORCE = 0.05;
const FRICTION = 0.95;
const COLLISION_PADDING = 5;

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

type ClusterViewProps = {
  categories: Category[];
  projects: Project[];
  onProjectCategoryChange?: (projectId: string, categoryId: string | null) => void;
};

export const ClusterView: React.FC<ClusterViewProps> = ({
  categories,
  projects,
  onProjectCategoryChange,
}) => {
  // Initialize nodes with physics properties
  const nodes = useSharedValue<ProjectNode[]>(
    projects.map((p, i) => ({
      ...p,
      x: SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 100,
      y: SCREEN_HEIGHT / 2 + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
    }))
  );

  const activeNodeId = useSharedValue<string | null>(null);
  const dragOffset = useSharedValue({ x: 0, y: 0 });

  // Physics simulation
  useFrameCallback((frameInfo) => {
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
          fx += dx * ATTRACTION_FORCE;
          fy += dy * ATTRACTION_FORCE;
        }
      }

      // Repulsion from other nodes (collision avoidance)
      for (let j = 0; j < newNodes.length; j++) {
        if (i === j) continue;
        const other = newNodes[j];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (NODE_RADIUS * 2) + COLLISION_PADDING;

        if (dist < minDist && dist > 0) {
          const force = ((minDist - dist) / dist) * REPULSION_FORCE;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }
      }

      // Update velocity with friction
      node.vx = (node.vx + fx) * FRICTION;
      node.vy = (node.vy + fy) * FRICTION;

      // Update position
      node.x += node.vx;
      node.y += node.vy;

      // Boundary constraints
      const margin = NODE_RADIUS + 10;
      if (node.x < margin) {
        node.x = margin;
        node.vx *= -0.5;
      }
      if (node.x > SCREEN_WIDTH - margin) {
        node.x = SCREEN_WIDTH - margin;
        node.vx *= -0.5;
      }
      if (node.y < margin) {
        node.y = margin;
        node.vy *= -0.5;
      }
      if (node.y > SCREEN_HEIGHT - margin) {
        node.y = SCREEN_HEIGHT - margin;
        node.vy *= -0.5;
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
  }, [projects]);

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        {/* Render category centers (subtle background) */}
        {categories.map((cat) => (
          <Group key={`cat-${cat.id}`}>
            <Circle
              cx={cat.center.x}
              cy={cat.center.y}
              r={CATEGORY_RADIUS}
              color={cat.color}
              opacity={0.08}
            />
          </Group>
        ))}

        {/* Render nodes */}
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

// Individual node renderer with drag gesture
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
      scale.value = withSpring(1.1);
      dragOffset.value = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((e) => {
      translateX.value = dragOffset.value.x + e.translationX;
      translateY.value = dragOffset.value.y + e.translationY;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      activeNodeId.value = null;

      // Check category assignment
      const nearestCat = findNearestCategory(translateX.value, translateY.value);
      const newCategoryId = nearestCat?.id || null;

      if (newCategoryId !== node.categoryId) {
        runOnJS(updateCategory)(node.id, newCategoryId);
      }

      // Update node position in shared state
      nodes.value = nodes.value.map((n: ProjectNode) =>
        n.id === node.id
          ? { ...n, x: translateX.value, y: translateY.value, categoryId: newCategoryId }
          : n
      );
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value - NODE_RADIUS },
      { translateY: translateY.value - NODE_RADIUS },
      { scale: scale.value },
    ],
  }));

  const category = categories.find((c) => c.id === node.categoryId);
  const color = category?.color || '#9CA3AF';
  const liquidHeight = (node.percent / 100) * (NODE_RADIUS * 2);
  const isComplete = node.percent >= 100;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.nodeContainer, animatedStyle]}>
        <Canvas style={styles.nodeCanvas}>
          <Group>
            {/* Glow effect for completed projects */}
            {isComplete && (
              <>
                <Circle cx={NODE_RADIUS} cy={NODE_RADIUS} r={NODE_RADIUS + 10} color={color} opacity={0.3}>
                  <Blur blur={15} />
                </Circle>
                <Circle cx={NODE_RADIUS} cy={NODE_RADIUS} r={NODE_RADIUS + 5} color={color} opacity={0.5}>
                  <Blur blur={10} />
                </Circle>
              </>
            )}

            {/* Outer circle (vessel border) */}
            <Circle
              cx={NODE_RADIUS}
              cy={NODE_RADIUS}
              r={NODE_RADIUS - 2}
              style="stroke"
              strokeWidth={3}
              color={color}
            />

            {/* Inner background */}
            <Circle cx={NODE_RADIUS} cy={NODE_RADIUS} r={NODE_RADIUS - 4} color="#FFFFFF" />

            {/* Liquid fill */}
            {liquidHeight > 0 && (
              <Group clip={Skia.Path.Make().addCircle(NODE_RADIUS, NODE_RADIUS, NODE_RADIUS - 4)}>
                <Circle
                  cx={NODE_RADIUS}
                  cy={NODE_RADIUS * 2 - liquidHeight}
                  r={NODE_RADIUS}
                  color={color}
                  opacity={0.2}
                />
                {/* Liquid gradient effect */}
                <Circle cx={NODE_RADIUS} cy={NODE_RADIUS * 2 - liquidHeight} r={NODE_RADIUS}>
                  <LinearGradient
                    start={vec(NODE_RADIUS, NODE_RADIUS * 2 - liquidHeight - NODE_RADIUS)}
                    end={vec(NODE_RADIUS, NODE_RADIUS * 2 - liquidHeight + NODE_RADIUS)}
                    colors={[color, color]}
                    positions={[0, 1]}
                  />
                  <Paint opacity={0.15} />
                </Circle>
              </Group>
            )}

            {/* Project initial letter - using a simple circle as placeholder */}
            {/* In production, you'd use skia-text or a custom text renderer */}
            <Circle
              cx={NODE_RADIUS}
              cy={NODE_RADIUS}
              r={12}
              color={color}
              opacity={0.8}
            />
          </Group>
        </Canvas>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  canvas: {
    flex: 1,
  },
  nodeContainer: {
    position: 'absolute',
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
  },
  nodeCanvas: {
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
  },
});
