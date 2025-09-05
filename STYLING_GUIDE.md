# Styling Guide - Maxx Motion Merge

This document outlines the styling system that has been merged from the Hackathon-2025 project into the maxx-motion-merge React Native app.

## Color Palette

The app uses a vibrant color palette inspired by the Hackathon design:

### Primary Colors

- **Red Orange**: `#ff5c4d` - Used for primary actions and headings
- **Orange**: `#ff9636` - Used for secondary elements and accents
- **Mimosa**: `#ffcd58` - Used for highlights and tertiary elements
- **Chartreuse**: `#dad870` - Used for success states and special elements
- **Blue**: `#38b1f6` - Used for backgrounds and primary app color

### Usage

```typescript
import { Colors } from "../constants/Colors";

// Access colors
const primaryColor = Colors.light.redOrange;
const secondaryColor = Colors.light.orange;
```

## Typography

The app uses a hierarchical typography system with uppercase headings:

### Typography Variants

- **h1**: 32px, Red Orange, Uppercase
- **h2**: 24px, Orange, Uppercase
- **h3**: 20px, Mimosa, Uppercase
- **h4**: 18px, Chartreuse, Uppercase
- **body**: 16px, Black, Regular
- **caption**: 14px, Gray, Regular

### Usage

```typescript
import { Text } from '../components/ThemedText';

<Text variant="h1">Main Heading</Text>
<Text variant="body">Regular text content</Text>
```

## Components

### Button Component

The Button component supports multiple variants:

```typescript
import { Button } from '../components/ui/button';

// Variants: primary, secondary, danger, mimosa, chartreuse
<Button label="Primary Action" onPress={handlePress} variant="primary" />
<Button label="Secondary Action" onPress={handlePress} variant="secondary" />
<Button label="Danger Action" onPress={handlePress} variant="danger" />
```

### Card Component

Cards provide consistent container styling with shadows:

```typescript
import { Card } from "../components/ui/card";

<Card>
  <Text variant="h2">Card Title</Text>
  <Text variant="body">Card content goes here</Text>
</Card>;
```

## Layout System

### Spacing

Consistent spacing scale:

- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **xxl**: 48px

### Border Radius

- **sm**: 4px
- **md**: 8px
- **lg**: 12px
- **xl**: 16px
- **xxl**: 20px

### Shadows

Three shadow levels for depth:

- **sm**: Subtle elevation
- **md**: Medium elevation (default for cards)
- **lg**: Strong elevation

## Common Styles

Utility classes for common layout patterns:

```typescript
import { CommonStyles } from '../constants/Styles';

// Center content
<View style={CommonStyles.centerContent}>

// Row layout
<View style={CommonStyles.row}>

// Space between items
<View style={CommonStyles.spaceBetween}>

// Full width
<View style={CommonStyles.fullWidth}>
```

## Layout Components

### Container

Default app container with blue background:

```typescript
import { Layout } from "../constants/Styles";

<View style={Layout.container}>{/* App content */}</View>;
```

### Section

Standard section spacing:

```typescript
<View style={Layout.section}>{/* Section content */}</View>
```

## Font

The app includes the Barabara font from the Hackathon project:

- **File**: `assets/fonts/BARABARA-final.otf`
- **Usage**: Applied to headings and branded elements

## Demo Component

To see all styling elements in action, use the `StylingDemo` component:

```typescript
import { StylingDemo } from "../components/StylingDemo";

<StylingDemo />;
```

This component showcases:

- All typography variants
- Color palette swatches
- Button variants
- Layout spacing examples

## Migration Notes

The styling system has been adapted from the Hackathon's Tailwind CSS approach to React Native's StyleSheet system while maintaining the visual design language and color palette.

Key changes:

- CSS classes → StyleSheet objects
- Tailwind utilities → Custom spacing and typography constants
- Web-specific properties → React Native equivalents
- Font loading adapted for React Native/Expo

## Best Practices

1. **Use the design system**: Always use the predefined colors, typography, and spacing
2. **Consistent spacing**: Use the spacing scale for margins and padding
3. **Typography hierarchy**: Use appropriate heading levels for content structure
4. **Color semantics**: Use colors consistently (red-orange for primary actions, etc.)
5. **Component composition**: Build new components using the existing base components
