import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Map, Navigation, Route, Search } from 'lucide-react-native';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@yara/shared';
import { TabParamList } from './types';
import { OverviewScreen } from '../screens/OverviewScreen';
import { LiveMapScreen } from '../screens/LiveMapScreen';
import { TrackBusScreen } from '../screens/TrackBusScreen';
import { RoutesScreen } from '../screens/RoutesScreen';
import { SearchScreen } from '../screens/SearchScreen';

const Tab = createBottomTabNavigator<TabParamList>();

interface TabBarButtonProps {
  icon: React.ReactElement;
  label: string;
  focused: boolean;
  onPress: () => void;
}

const TabBarButton: React.FC<TabBarButtonProps> = ({ icon, label, focused, onPress }) => (
  <Pressable style={[styles.tabButton, focused && styles.tabButtonFocused]} onPress={onPress} accessibilityRole="button">
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>{icon}</View>
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
  </Pressable>
);

export const TabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarActiveTintColor: colors.transit.inboundBlue,
      tabBarInactiveTintColor: colors.text.muted,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabLabel,
      headerShown: false,
    })}
  >
    <Tab.Screen
      name="Overview"
      component={OverviewScreen}
      options={{
        tabBarIcon: ({ focused, color }) => (
          <Home size={24} color={color} strokeWidth={focused ? 3 : 2} fill={focused ? colors.transit.inboundBlue : 'none'} />
        ),
      }}
    />
    <Tab.Screen
      name="LiveMap"
      component={LiveMapScreen}
      options={{
        tabBarIcon: ({ focused, color }) => (
          <Map size={24} color={color} strokeWidth={focused ? 3 : 2} fill={focused ? colors.transit.inboundBlue : 'none'} />
        ),
      }}
    />
    <Tab.Screen
      name="TrackBus"
      component={TrackBusScreen}
      options={{
        tabBarIcon: ({ focused, color }) => (
          <Navigation size={24} color={color} strokeWidth={focused ? 3 : 2} fill={focused ? colors.transit.inboundBlue : 'none'} />
        ),
      }}
    />
    <Tab.Screen
      name="Routes"
      component={RoutesScreen}
      options={{
        tabBarIcon: ({ focused, color }) => (
          <Route size={24} color={color} strokeWidth={focused ? 3 : 2} fill={focused ? colors.transit.inboundBlue : 'none'} />
        ),
      }}
    />
    <Tab.Screen
      name="Search"
      component={SearchScreen}
      options={{
        tabBarIcon: ({ focused, color }) => (
          <Search size={24} color={color} strokeWidth={focused ? 3 : 2} fill={focused ? colors.transit.inboundBlue : 'none'} />
        ),
      }}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bg.dark,
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
    paddingBottom: 8,
    height: 72,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabButtonFocused: {},
  iconContainer: { marginBottom: 2 },
  iconContainerFocused: { transform: [{ scale: 1.1 }] },
  tabLabel: { fontSize: 11, fontWeight: '500' },
  tabLabelFocused: { fontWeight: '700' },
});
