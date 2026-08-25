import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TabNavigator } from './TabNavigator';
import { RouteDetailScreen } from '../screens/RouteDetailScreen';
import { KioskScreen } from '../screens/KioskScreen';
import { AdminScreen } from '../screens/AdminScreen';
import { RootStackParamList } from './types';
import { colors } from '@yara/shared';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.bg.dark },
      headerShadowVisible: false,
      headerTintColor: colors.text.inverse,
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <Stack.Screen
      name="MainTabs"
      component={TabNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="RouteDetail"
      component={RouteDetailScreen}
      options={{ title: 'Route Details' }}
    />
    <Stack.Screen
      name="Kiosk"
      component={KioskScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Admin"
      component={AdminScreen}
      options={{ presentation: 'modal', headerShown: false }}
    />
  </Stack.Navigator>
);

export const RootNavigator: React.FC = () => (
  <SafeAreaProvider>
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg.dark} />
      <RootStack />
    </NavigationContainer>
  </SafeAreaProvider>
);
