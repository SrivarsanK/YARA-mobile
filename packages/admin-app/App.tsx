import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AdminNavigator } from './src/navigation/AdminNavigator';
import { AdminProvider } from './src/context/AdminContext';
import { colors } from '@yara/shared';

export default function App() {
  return (
    <View style={styles.container}>
      <AdminProvider>
        <AdminNavigator />
      </AdminProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.dark,
  },
});
