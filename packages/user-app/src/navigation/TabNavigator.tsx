import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MapPin, Navigation, Route, Search } from 'lucide-react-native';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { TabParamList } from './types';
import { LiveMapScreen } from '../screens/LiveMapScreen';
import { TrackBusScreen } from '../screens/TrackBusScreen';
import { RoutesScreen } from '../screens/RoutesScreen';
import { SearchScreen } from '../screens/SearchScreen';

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarActiveTintColor: '#b17816',
      tabBarInactiveTintColor: '#64748b',
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabLabel,
      tabBarItemStyle: styles.tabItem,
      headerShown: false,
    })}
  >
    <Tab.Screen
      name="LiveMap"
      component={LiveMapScreen}
      options={{
        tabBarLabel: 'Live Map',
        tabBarIcon: ({ focused, color }) => (
          <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
            <MapPin size={20} color={focused ? '#b17816' : '#64748b'} strokeWidth={focused ? 2.5 : 2} />
          </View>
        ),
      }}
    />
    <Tab.Screen
      name="TrackBus"
      component={TrackBusScreen}
      options={{
        tabBarLabel: 'Track Bus',
        tabBarIcon: ({ focused, color }) => (
          <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
            <Navigation size={20} color={focused ? '#b17816' : '#64748b'} strokeWidth={focused ? 2.5 : 2} />
          </View>
        ),
      }}
    />
    <Tab.Screen
      name="Routes"
      component={RoutesScreen}
      options={{
        tabBarLabel: 'Routes',
        tabBarIcon: ({ focused, color }) => (
          <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
            <Route size={20} color={focused ? '#b17816' : '#64748b'} strokeWidth={focused ? 2.5 : 2} />
          </View>
        ),
      }}
    />
    <Tab.Screen
      name="Search"
      component={SearchScreen}
      options={{
        tabBarLabel: 'Search',
        tabBarIcon: ({ focused, color }) => (
          <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
            <Search size={20} color={focused ? '#b17816' : '#64748b'} strokeWidth={focused ? 2.5 : 2} />
          </View>
        ),
      }}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: 6,
    paddingTop: 6,
    height: 64,
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.05)',
  },
  tabItem: {
    paddingVertical: 2,
  },
  iconBox: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: '#FEF3C7',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
