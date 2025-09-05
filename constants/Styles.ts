import { Colors } from "./Colors";

// Typography
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: "600" as const,
    textTransform: "uppercase" as any,
    color: Colors.light.redOrange,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600" as const,
    textTransform: "uppercase" as any,
    color: Colors.light.orange,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
    textTransform: "uppercase" as any,
    color: Colors.light.mimosa,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
    textTransform: "uppercase" as any,
    color: Colors.light.chartreuse,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: "#000",
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: "#666",
  },
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Layout
export const Layout = {
  container: {
    flex: 1,
    backgroundColor: Colors.light.blue,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    margin: Spacing.md,
    ...Shadows.md,
  },
  section: {
    marginVertical: Spacing.md,
  },
};

// Common styles
export const CommonStyles = {
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center",
  },
  spaceBetween: {
    flexDirection: "row" as const,
    justifyContent: "space-between",
    alignItems: "center",
  },
  fullWidth: {
    width: "100%",
  },
  textCenter: {
    textAlign: "center" as const,
  },
};
