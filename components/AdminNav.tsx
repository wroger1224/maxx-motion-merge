import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from './ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from './ui/IconSymbol';

export function AdminNav() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.navContainer, { paddingTop: insets.top }]}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => {
          // This will be handled by the drawer
          console.log('Menu button pressed');
        }}
      >
        <IconSymbol name="line.3.horizontal" color="#333" size={20} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <ThemedText style={styles.title}>Admin</ThemedText>
      </View>

      <TouchableOpacity
        style={styles.exitButton}
        onPress={() => router.replace('/')}
      >
        <ThemedText style={styles.exitText}>Exit</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  menuButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  exitButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#C41E3A',
  },
  exitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 