import type { NavigatorScreenParams } from "@react-navigation/native";

export type MainTabParamList = {
  Dashboard: undefined;
  Habits: undefined;
  Sleep: undefined;
  Activity: undefined;
  Nutrition: undefined;
  Trends: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  HabitDetail: { habitId: string };
  AddHabit: undefined;
  BarcodeScanner: undefined;
  AddFoodManually: { barcode?: string } | undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
