import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export type AdminMenuProps = {
  position?: 'topRight' | 'topLeft';
};

export function AdminMenu({ position = 'topRight' }: AdminMenuProps) {
  console.log('AdminMenu component loaded with position:', position);

  const navigateToAdmin = () => {
    router.push('/admin/setup' as any);
  };

  return (
    <View style={[styles.container, position === 'topLeft' ? styles.topLeft : styles.topRight]}>
      <View style={styles.adminButton}>
        <TouchableOpacity onPress={navigateToAdmin}>
          <Text style={styles.adminButtonText}>ADMIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  topRight: {
    top: 10,
    right: 120,
  },
  topLeft: {
    top: 10,
    left: 10,
  },
  adminButton: {
    backgroundColor: Colors.light.redOrange,
    padding: 10,
    borderRadius: 20,
  },
  adminButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
}); 