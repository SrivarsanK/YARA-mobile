import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

export type TabParamList = {
  LiveMap: undefined;
  TrackBus: undefined;
  Routes: undefined;
  Search: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  RouteDetail: { routeId: string; directionId?: number };
  Kiosk: undefined;
  Admin: undefined;
};

export type TabNavigationProp = BottomTabNavigationProp<TabParamList>;
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type ScreenNavigationProp = CompositeNavigationProp<RootStackNavigationProp, TabNavigationProp>;
