import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text } from "./ThemedText";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Colors } from "../constants/Colors";
import { Layout, Spacing, CommonStyles } from "../constants/Styles";

export function StylingDemo() {
  return (
    <ScrollView style={Layout.container}>
      <View style={styles.container}>
        {/* Typography Demo */}
        <Card style={styles.section}>
          <Text variant="h1" style={styles.sectionTitle}>
            Typography
          </Text>
          <Text variant="h1">Heading 1 - Red Orange</Text>
          <Text variant="h2">Heading 2 - Orange</Text>
          <Text variant="h3">Heading 3 - Mimosa</Text>
          <Text variant="h4">Heading 4 - Chartreuse</Text>
          <Text variant="body">Body text - Regular paragraph text</Text>
          <Text variant="caption">Caption text - Smaller descriptive text</Text>
        </Card>

        {/* Color Palette Demo */}
        <Card style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Color Palette
          </Text>
          <View style={styles.colorGrid}>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: Colors.light.redOrange },
              ]}
            >
              <Text style={styles.colorLabel}>Red Orange</Text>
            </View>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: Colors.light.orange },
              ]}
            >
              <Text style={styles.colorLabel}>Orange</Text>
            </View>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: Colors.light.mimosa },
              ]}
            >
              <Text style={styles.colorLabel}>Mimosa</Text>
            </View>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: Colors.light.chartreuse },
              ]}
            >
              <Text style={styles.colorLabel}>Chartreuse</Text>
            </View>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: Colors.light.blue },
              ]}
            >
              <Text style={styles.colorLabel}>Blue</Text>
            </View>
          </View>
        </Card>

        {/* Button Variants Demo */}
        <Card style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Button Variants
          </Text>
          <View style={styles.buttonGrid}>
            <Button label="Primary" onPress={() => {}} variant="primary" />
            <Button label="Secondary" onPress={() => {}} variant="secondary" />
            <Button label="Danger" onPress={() => {}} variant="danger" />
            <Button label="Mimosa" onPress={() => {}} variant="mimosa" />
            <Button
              label="Chartreuse"
              onPress={() => {}}
              variant="chartreuse"
            />
            <Button label="Disabled" onPress={() => {}} disabled />
          </View>
        </Card>

        {/* Layout Demo */}
        <Card style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Layout Components
          </Text>
          <View style={[CommonStyles.row, styles.spacingDemo]}>
            <View style={[styles.spacingBox, { marginRight: Spacing.sm }]}>
              <Text variant="caption">Small</Text>
            </View>
            <View style={[styles.spacingBox, { marginRight: Spacing.md }]}>
              <Text variant="caption">Medium</Text>
            </View>
            <View style={[styles.spacingBox, { marginRight: Spacing.lg }]}>
              <Text variant="caption">Large</Text>
            </View>
            <View style={styles.spacingBox}>
              <Text variant="caption">Extra Large</Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  colorSwatch: {
    width: "18%",
    height: 60,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  colorLabel: {
    color: "#fff",
    fontSize: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  buttonGrid: {
    gap: Spacing.sm,
  },
  spacingDemo: {
    marginVertical: Spacing.sm,
  },
  spacingBox: {
    backgroundColor: Colors.light.mimosa,
    padding: Spacing.sm,
    borderRadius: 4,
    alignItems: "center",
  },
});
