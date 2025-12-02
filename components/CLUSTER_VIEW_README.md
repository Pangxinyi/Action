# Gravity Clusters Visualization

A high-performance, physics-based project visualization component for React Native, built with Skia, Reanimated, and Gesture Handler.

## Features

✨ **Physics-Based Animation**
- Realistic gravity simulation pulling nodes to category centers
- Collision avoidance between nodes
- Smooth 60fps+ rendering using React Native Skia

🎨 **Liquid Vessel Metaphor**
- Circular "vessels" that fill with liquid based on progress (0-100%)
- Dynamic color matching category assignment
- Vibrant glow effect when projects reach 100% completion

🖐️ **Interactive Drag & Drop**
- Smooth drag gestures using React Native Gesture Handler
- Auto-categorization when dropped near category centers
- Visual feedback during interactions

⚡ **High Performance**
- Worklet-based physics running on UI thread
- Optimized collision detection
- Efficient Canvas rendering

## Installation

The following dependencies are already installed in your project:

```json
{
  "@shopify/react-native-skia": "^1.0.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-gesture-handler": "~2.28.0"
}
```

## Usage

### Basic Example

```tsx
import React, { useState } from 'react';
import { ClusterView, Category, Project } from '@components/ClusterView';

export const MyScreen = () => {
  const categories: Category[] = [
    {
      id: 'work',
      name: 'Work',
      color: '#3B82F6',
      center: { x: 150, y: 200 },
    },
    {
      id: 'learning',
      name: 'Learning',
      color: '#8B5CF6',
      center: { x: 300, y: 200 },
    },
  ];

  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'p1',
      name: 'App Design',
      percent: 75,
      categoryId: 'work',
    },
  ]);

  const handleCategoryChange = (projectId: string, categoryId: string | null) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, categoryId } : p))
    );
  };

  return (
    <ClusterView
      categories={categories}
      projects={projects}
      onProjectCategoryChange={handleCategoryChange}
    />
  );
};
```

### Advanced Example

For enhanced visual effects and optimized physics:

```tsx
import { ClusterViewAdvanced } from '@components/ClusterViewAdvanced';

// Use the same way as ClusterView, but with better visuals
<ClusterViewAdvanced
  categories={categories}
  projects={projects}
  onProjectCategoryChange={handleCategoryChange}
/>
```

## API Reference

### ClusterView Props

| Prop | Type | Description |
|------|------|-------------|
| `categories` | `Category[]` | Array of category definitions with positions |
| `projects` | `Project[]` | Array of projects to visualize |
| `onProjectCategoryChange` | `(projectId: string, categoryId: string \| null) => void` | Callback when a project is moved to a new category |

### Category Type

```typescript
type Category = {
  id: string;           // Unique identifier
  name: string;         // Display name
  color: string;        // Hex color (e.g., '#3B82F6')
  center: {             // Position on canvas
    x: number;
    y: number;
  };
};
```

### Project Type

```typescript
type Project = {
  id: string;           // Unique identifier
  name: string;         // Project name (first letter shown)
  percent: number;      // Progress 0-100 (fills liquid)
  categoryId: string | null;  // Assigned category or null
};
```

## Configuration

You can customize the physics and visual parameters by modifying the constants in the component files:

```typescript
// ClusterView.tsx or ClusterViewAdvanced.tsx

const NODE_RADIUS = 45;           // Size of each node
const CATEGORY_RADIUS = 100;      // Detection radius for categories
const REPULSION_FORCE = 600;      // Strength of node repulsion
const ATTRACTION_FORCE = 0.08;    // Strength of category attraction
const FRICTION = 0.92;            // Velocity damping (0-1)
```

## Visual Effects

### Liquid Fill
- Animates smoothly when `percent` changes
- Fills from bottom to top
- Uses category color with transparency

### Completion Glow
- Automatically appears when `percent >= 100`
- Multi-layered blur effect
- Vibrant, eye-catching animation

### Drag Feedback
- Node scales up slightly when grabbed
- Smooth spring animation on release
- Visual indicator of active state

## Performance Optimization

The component is optimized for:
- **60+ FPS** rendering on most devices
- **Efficient collision detection** (O(n²) but optimized for typical use)
- **Worklet-based physics** running on UI thread
- **Minimal re-renders** using Reanimated shared values

### Best Practices

1. **Limit total nodes**: Optimal performance with < 30 nodes
2. **Category positioning**: Space categories 200-300px apart
3. **Initial positions**: Start nodes near their category centers
4. **Update frequency**: Batch project updates when possible

## Integration with Existing App

### Step 1: Import into your Projects View

```tsx
// app/index.tsx or your main screen
import { ClusterViewAdvanced } from '@components/ClusterViewAdvanced';
```

### Step 2: Map your data structure

```tsx
// Convert your existing data to the required format
const mappedCategories: Category[] = categories.map((cat, index) => ({
  id: cat.id,
  name: cat.name,
  color: cat.hexColor,
  center: calculateCategoryPosition(index, categories.length),
}));

const mappedProjects: Project[] = projects.map((p) => ({
  id: String(p.id),
  name: p.name,
  percent: p.percent,
  categoryId: p.category || null,
}));
```

### Step 3: Handle category changes

```tsx
const handleCategoryChange = (projectId: string, categoryId: string | null) => {
  setProjects((prev) =>
    prev.map((p) =>
      p.id === Number(projectId)
        ? { ...p, category: categoryId }
        : p
    )
  );
  
  // Persist to storage if needed
  saveToAsyncStorage(projects);
};
```

## Troubleshooting

### "Skia not rendering"
- Ensure `@shopify/react-native-skia` is properly installed
- Rebuild your app: `npx expo prebuild && npx expo run:ios`

### "Physics too fast/slow"
- Adjust `FRICTION` (higher = slower)
- Adjust `ATTRACTION_FORCE` (lower = slower convergence)

### "Nodes overlapping"
- Increase `REPULSION_FORCE`
- Increase `COLLISION_PADDING`
- Reduce total number of nodes

### "Performance issues"
- Use `ClusterView` instead of `ClusterViewAdvanced`
- Reduce blur radius in glow effects
- Limit total nodes to < 20

## Examples

See complete working examples in:
- `ClusterViewExample.tsx` - Basic implementation
- Your existing `app/index.tsx` - Integration patterns

## License

Part of the Action productivity app.
