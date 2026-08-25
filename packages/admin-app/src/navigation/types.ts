import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AdminStackParamList = {
  Dashboard: undefined;
  Inject: undefined;
  Fleet: undefined;
  Scenario: undefined;
  Database: undefined;
};

export type AdminStackNavigationProp = NativeStackNavigationProp<AdminStackParamList>;
