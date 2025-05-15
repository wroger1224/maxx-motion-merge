import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { ThemedText } from './ThemedText';

const adminLinks = [
  { label: 'Setup', route: '/admin/setup' },
  { label: 'Reports', route: '/admin/reports' },
  { label: 'Activity Types', route: '/admin/activity-types' },
  { label: 'User Management', route: '/admin/users' },
];

export function AdminNav() {
  const router = useRouter();
  const segments = useSegments();
  const current = '/' + segments.slice(1).join('/');

  return (
    <View style={styles.navBar}>
      {adminLinks.map(link => (
        <TouchableOpacity
          key={link.route}
          style={[
            styles.navItem,
            current === link.route && styles.activeNavItem
          ]}
          onPress={() => router.replace(link.route as any)}
        >
          <ThemedText style={[styles.navText, current === link.route && styles.activeNavText]}>{link.label}</ThemedText>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={() => router.replace('/')}
      >
        <ThemedText style={styles.exitText}>Exit Admin</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  navItem: {
    marginRight: 18,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  activeNavItem: {
    backgroundColor: '#0a7ea4',
  },
  navText: {
    fontSize: 16,
    color: '#0a7ea4',
  },
  activeNavText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  exitButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#C41E3A',
    marginLeft: 'auto',
    marginTop: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  exitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 