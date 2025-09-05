import { Text as DefaultText, useColorScheme, View } from "react-native";

import { Colors } from "../constants/Colors";
import { Typography } from "../constants/Styles";

export type TextProps = DefaultText["props"] & {
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "caption";
  color?: keyof typeof Colors.light & keyof typeof Colors.dark;
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function Text(props: TextProps) {
  const { style, variant = "body", color, ...otherProps } = props;
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, color || "text");

  const variantStyle = Typography[variant];

  return (
    <DefaultText
      style={[
        variantStyle,
        { color: color ? Colors[colorScheme || "light"][color] : textColor },
        style,
      ]}
      {...otherProps}
    />
  );
}

// Export ThemedText as an alias for Text to maintain backward compatibility
export const ThemedText = Text;

export function ThemedView(props: View["props"]) {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, "background");

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
