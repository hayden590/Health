import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "@/theme/useTheme";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import type { RootStackParamList } from "./types";
import { MainTabs } from "./MainTabs";
import { OnboardingScreen } from "@/screens/Onboarding/OnboardingScreen";
import { HabitDetailScreen } from "@/screens/Habits/HabitDetailScreen";
import { AddHabitScreen } from "@/screens/Habits/AddHabitScreen";
import { BarcodeScannerScreen } from "@/screens/Nutrition/BarcodeScannerScreen";
import { AddFoodManuallyScreen } from "@/screens/Nutrition/AddFoodManuallyScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { colors, isDark } = useTheme();
  const completed = useOnboardingStore((s) => s.completed);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={completed ? "MainTabs" : "Onboarding"}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="HabitDetail"
          component={HabitDetailScreen}
          options={{ headerShown: true, title: "Habit", headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.textPrimary }}
        />
        <Stack.Screen
          name="AddHabit"
          component={AddHabitScreen}
          options={{ presentation: "modal", headerShown: true, title: "New Habit", headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.textPrimary }}
        />
        <Stack.Screen
          name="BarcodeScanner"
          component={BarcodeScannerScreen}
          options={{ presentation: "fullScreenModal", headerShown: false }}
        />
        <Stack.Screen
          name="AddFoodManually"
          component={AddFoodManuallyScreen}
          options={{ presentation: "modal", headerShown: true, title: "Log Food", headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.textPrimary }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
