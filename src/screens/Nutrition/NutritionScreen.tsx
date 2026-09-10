import { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { useTheme } from "@/theme/useTheme";
import { useNutritionStore } from "@/store/useNutritionStore";
import type { MainTabParamList, RootStackParamList } from "@/navigation/types";
import { MacroBar } from "./components/MacroBar";
import { FoodLogItem } from "./components/FoodLogItem";

const CALORIE_GOAL = 2100;
const PROTEIN_GOAL = 130;
const CARBS_GOAL = 250;
const FAT_GOAL = 70;

type NutritionNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Nutrition">,
  NativeStackNavigationProp<RootStackParamList>
>;

export function NutritionScreen() {
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation<NutritionNavigation>();

  const today = useNutritionStore((s) => s.today);
  const loading = useNutritionStore((s) => s.loading);
  const load = useNutritionStore((s) => s.load);
  const removeEntry = useNutritionStore((s) => s.removeEntry);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const calories = today.reduce((sum, e) => sum + e.calories, 0);
  const protein = today.reduce((sum, e) => sum + e.proteinG, 0);
  const carbs = today.reduce((sum, e) => sum + e.carbsG, 0);
  const fat = today.reduce((sum, e) => sum + e.fatG, 0);

  return (
    <ScreenContainer>
      <View style={[styles.headerRow, { marginBottom: spacing.xl }]}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Nutrition</Text>
        <PrimaryButton label="Scan" onPress={() => navigation.navigate("BarcodeScanner")} />
      </View>

      {loading && today.length === 0 ? (
        <LoadingState />
      ) : (
        <>
          <Card style={{ marginBottom: spacing.lg, alignItems: "center" }}>
            <ProgressRing
              size={140}
              strokeWidth={14}
              progress={calories / CALORIE_GOAL}
              colorFrom={colors.nutrition}
              colorTo="#8FE3FF"
              trackColor={colors.surfaceAlt}
            >
              <Text style={[typography.display, { color: colors.textPrimary }]}>
                {Math.round(calories)}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                of {CALORIE_GOAL} kcal
              </Text>
            </ProgressRing>
          </Card>

          <Card style={{ marginBottom: spacing.lg }}>
            <MacroBar label="Protein" grams={protein} goalGrams={PROTEIN_GOAL} color={colors.nutrition} />
            <MacroBar label="Carbs" grams={carbs} goalGrams={CARBS_GOAL} color={colors.activity} />
            <MacroBar label="Fat" grams={fat} goalGrams={FAT_GOAL} color={colors.mood} />
          </Card>

          <Card>
            <View style={[styles.headerRow, { marginBottom: spacing.md }]}>
              <Text style={[typography.h3, { color: colors.textPrimary }]}>Today's food</Text>
              <Pressable onPress={() => navigation.navigate("AddFoodManually", undefined)} hitSlop={8}>
                <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
              </Pressable>
            </View>
            {today.length === 0 ? (
              <EmptyState
                emoji="🍽️"
                title="Nothing logged yet"
                subtitle="Scan a barcode or add food manually"
              />
            ) : (
              today.map((entry) => (
                <FoodLogItem key={entry.id} entry={entry} onDelete={() => removeEntry(entry.id)} />
              ))
            )}
          </Card>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
