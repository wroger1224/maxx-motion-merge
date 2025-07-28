import React from "react";
import { View, StyleSheet } from "react-native";
import { Layout, Spacing } from "../../constants/Styles";

export function Card({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    ...Layout.card,
  },
});
