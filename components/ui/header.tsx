import { Colors } from "@/constants/Colors";
import { ResponsiveHeader } from "@/components/ui/responsiveHeader";
import { LinearGradient } from "expo-linear-gradient";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AdminMenu } from "@/components/AdminMenu";
import { useAuth } from "@/lib/auth";

export function Header({
  signOut,
  title,
  tagline,
}: {
  signOut?: () => void;
  title: string;
  tagline: string;
}) {
  const { signOut: authSignOut } = useAuth();
  const handleSignOut = () => {
    void (signOut ? signOut() : authSignOut());
  };
  return (
   
      <ResponsiveHeader source={require("@/assets/images/gym-equipment.png")}>
        <LinearGradient
          colors={[Colors.light.blue, "rgba(0, 0, 0, 0.7)"]}
          style={styles.headerOverlay}
        >
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>MAXX Motion</ThemedText>
            <TouchableOpacity onPress={handleSignOut}>
              <ThemedText style={styles.headerButton}>Sign Out</ThemedText>
            </TouchableOpacity>
            <AdminMenu />
          </View>
          <View style={styles.headerContent}>
            <ThemedText variant="h1" style={styles.pageTitle}>
              {title}
            </ThemedText>
            <ThemedText style={styles.tagline}>
              {tagline}
            </ThemedText>
          </View>
        </LinearGradient>
      </ResponsiveHeader>
  
  );
}

const styles = StyleSheet.create({

  headerOverlay: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingLeft: 16,
    paddingRight: 16,
    zIndex: 1,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.redOrange,
    borderRadius: 8,
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
});
