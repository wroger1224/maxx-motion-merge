import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors } from "../../constants/Colors";

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  style = {},
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "mimosa" | "chartreuse";
  disabled?: boolean;
  style?: object;
}) {
  const buttonStyles = [
    styles.button,
    variant === "primary" && styles.primaryButton,
    variant === "secondary" && styles.secondaryButton,
    variant === "danger" && styles.dangerButton,
    variant === "mimosa" && styles.mimosaButton,
    variant === "chartreuse" && styles.chartreuseButton,
    disabled && styles.disabledButton,
    style,
  ];

  const textStyles = [
    styles.text,
    variant === "primary" && styles.primaryText,
    variant === "secondary" && styles.secondaryText,
    variant === "danger" && styles.dangerText,
    variant === "mimosa" && styles.mimosaText,
    variant === "chartreuse" && styles.chartreuseText,
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={textStyles}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: Colors.light.redOrange,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Colors.light.orange,
  },
  dangerButton: {
    backgroundColor: Colors.light.redOrange,
  },
  mimosaButton: {
    backgroundColor: Colors.light.mimosa,
  },
  chartreuseButton: {
    backgroundColor: Colors.light.chartreuse,
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "uppercase" as any,
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: Colors.light.orange,
  },
  dangerText: {
    color: "#fff",
  },
  mimosaText: {
    color: "#000",
  },
  chartreuseText: {
    color: "#000",
  },
  disabledText: {
    color: "#888",
  },
});
