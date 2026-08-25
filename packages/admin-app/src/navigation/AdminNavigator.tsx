import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DashboardScreen } from '../screens/DashboardScreen';
import { InjectScreen } from '../screens/InjectScreen';
import { FleetScreen } from '../screens/FleetScreen';
import { ScenarioScreen } from '../screens/ScenarioScreen';
import { DatabaseScreen } from '../screens/DatabaseScreen';
import { AdminStackParamList } from './types';
import { colors } from '@yara/shared';

const Stack = createNativeStackNavigator<AdminStackParamList>();

const AdminStack: React.FC = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.bg.dark },
      headerShadowVisible: false,
      headerTintColor: colors.text.inverse,
      headerTitleStyle: { fontWeight: '600' },
    }}
  >
    <Stack.Screen name='Dashboard' component={DashboardScreen} options={{ title: 'Dashboard' }} />
    <Stack.Screen name='Inject' component={InjectScreen} options={{ title: 'Fault Injection' }} />
    <Stack.Screen name='Fleet' component={FleetScreen} options={{ title: 'Fleet' }} />
    <Stack.Screen name='Scenario' component={ScenarioScreen} options={{ title: 'Scenarios' }} />
    <Stack.Screen name='Database' component={DatabaseScreen} options={{ title: 'Database' }} />
  </Stack.Navigator>
);

export const AdminNavigator: React.FC = () => (
  <SafeAreaProvider>
    <NavigationContainer>
      <StatusBar barStyle='light-content' backgroundColor={colors.bg.dark} />
      <AdminStack />
    </NavigationContainer>
  </SafeAreaProvider>
);
