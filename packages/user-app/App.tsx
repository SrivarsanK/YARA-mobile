import React from 'react';
import { RootNavigator } from './src/navigation/RootNavigator';
import { TransitProvider } from './src/context/TransitContext';
import { RoutesProvider } from './src/context/RoutesContext';
import { colors } from '@yara/shared';
import { StyleSheet, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <TransitProvider>
        <RoutesProvider>
          <RootNavigator />
        </RoutesProvider>
      </TransitProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.dark,
  },
});
