import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { TransitProvider } from './src/context/TransitContext';
import { RoutesProvider } from './src/context/RoutesContext';
import { colors } from '@yara/shared';
import { StyleSheet } from 'react-native';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <TransitProvider>
        <RoutesProvider>
          <RootNavigator />
        </RoutesProvider>
      </TransitProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.dark,
  },
});
