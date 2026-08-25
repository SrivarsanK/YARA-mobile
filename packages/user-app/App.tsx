import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootNavigator } from './src/navigation/RootNavigator';
import { TransitProvider } from './src/context/TransitContext';
import { RoutesProvider } from './src/context/RoutesContext';
import { StyleSheet, Platform, Image } from 'react-native';

export default function App() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'yara-transit-bg-style';
      if (!document.getElementById(styleId)) {
        try {
          const bgModule = Image.resolveAssetSource(require('./assets/transit-bg-pattern.jpg'));
          const bgUri = bgModule?.uri || '';
          const style = document.createElement('style');
          style.id = styleId;
          style.innerHTML = `
            html, body, #root {
              background-color: #f6f4eb !important;
              ${bgUri ? `background-image: url('${bgUri}') !important;` : ''}
              background-repeat: repeat !important;
              background-position: top left !important;
              background-size: 360px auto !important;
              color: #1e293b;
              min-height: 100vh;
              margin: 0;
              padding: 0;
            }
          `;
          document.head.appendChild(style);
        } catch (e) {
          console.warn('Background image resolve error:', e);
        }
      }
    }
  }, []);

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
    backgroundColor: '#F6F4EB',
  },
});
