import { registerRootComponent } from 'expo';
import { LogBox, Platform } from 'react-native';
import App from './App';

// Suppress known 3rd-party library React Native Web deprecation warnings
LogBox.ignoreLogs([
  'props.pointerEvents is deprecated. Use style.pointerEvents',
  '"shadow*" style props are deprecated. Use "boxShadow".',
]);

if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('props.pointerEvents is deprecated') ||
       args[0].includes('"shadow*" style props are deprecated'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

registerRootComponent(App);
