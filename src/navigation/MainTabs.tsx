import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme/useTheme";
import type { MainTabParamList } from "./types";
import { DashboardScreen } from "@/screens/Dashboard/DashboardScreen";
import { HabitsScreen } from "@/screens/Habits/HabitsScreen";
import { SleepScreen } from "@/screens/Sleep/SleepScreen";
import { ActivityScreen } from "@/screens/Activity/ActivityScreen";
import { NutritionScreen } from "@/screens/Nutrition/NutritionScreen";
import { TrendsScreen } from "@/screens/Trends/TrendsScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: "home",
  Habits: "checkmark-circle",
  Sleep: "moon",
  Activity: "walk",
  Nutrition: "nutrition",
  Trends: "trending-up",
};

export function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name as keyof MainTabParamList]} size={size - 3} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="Habits" component={HabitsScreen} />
      <Tab.Screen name="Sleep" component={SleepScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Trends" component={TrendsScreen} />
    </Tab.Navigator>
  );
}
