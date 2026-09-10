import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { LoadingState } from "@/components/ui/LoadingState";
import { useTheme } from "@/theme/useTheme";
import { useNutritionStore } from "@/store/useNutritionStore";
import { lookupBarcode } from "@/services/openFoodFacts";
import type { RootStackParamList } from "@/navigation/types";
import { todayIso } from "@/utils/date";

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "numeric";
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: FieldProps) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
          },
        ]}
      />
    </View>
  );
}

export function AddFoodManuallyScreen() {
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "AddFoodManually">>();
  const barcode = route.params?.barcode ?? null;
  const addEntry = useNutritionStore((s) => s.addEntry);

  const [lookingUp, setLookingUp] = useState(Boolean(barcode));
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [servingDescription, setServingDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!barcode) return;
    let cancelled = false;
    setLookingUp(true);
    lookupBarcode(barcode)
      .then((product) => {
        if (cancelled) return;
        if (!product) {
          setNotFound(true);
          return;
        }
        setName(product.name);
        setBrand(product.brand ?? "");
        setServingDescription(product.servingDescription ?? "");
        setCalories(String(product.caloriesPerServing));
        setProtein(String(product.proteinPerServing));
        setCarbs(String(product.carbsPerServing));
        setFat(String(product.fatPerServing));
      })
      .catch(() => setNotFound(true))
      .finally(() => {
        if (!cancelled) setLookingUp(false);
      });
    return () => {
      cancelled = true;
    };
  }, [barcode]);

  const canSave = name.trim().length > 0 && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await addEntry({
      date: todayIso(),
      name: name.trim(),
      brand: brand.trim() || null,
      barcode,
      calories: parseFloat(calories) || 0,
      proteinG: parseFloat(protein) || 0,
      carbsG: parseFloat(carbs) || 0,
      fatG: parseFloat(fat) || 0,
      servingDescription: servingDescription.trim() || null,
    });
    setSaving(false);
    navigation.goBack();
  };

  if (lookingUp) {
    return (
      <ScreenContainer scroll={false}>
        <LoadingState />
        <Text style={[typography.caption, { color: colors.textSecondary, textAlign: "center" }]}>
          Looking up product…
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {notFound && (
        <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.lg }]}>
          Couldn't find that barcode — enter the details manually.
        </Text>
      )}

      <Field label="NAME" value={name} onChangeText={setName} placeholder="e.g. Greek yogurt" />
      <Field label="BRAND (OPTIONAL)" value={brand} onChangeText={setBrand} placeholder="e.g. Chobani" />
      <Field
        label="SERVING (OPTIONAL)"
        value={servingDescription}
        onChangeText={setServingDescription}
        placeholder="e.g. 1 cup (170g)"
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="CALORIES" value={calories} onChangeText={setCalories} keyboardType="numeric" placeholder="0" />
        </View>
        <View style={[styles.half, { marginLeft: 12 }]}>
          <Field label="PROTEIN (G)" value={protein} onChangeText={setProtein} keyboardType="numeric" placeholder="0" />
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="CARBS (G)" value={carbs} onChangeText={setCarbs} keyboardType="numeric" placeholder="0" />
        </View>
        <View style={[styles.half, { marginLeft: 12 }]}>
          <Field label="FAT (G)" value={fat} onChangeText={setFat} keyboardType="numeric" placeholder="0" />
        </View>
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <PrimaryButton label="Log food" onPress={onSave} disabled={!canSave} loading={saving} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  row: { flexDirection: "row" },
  half: { flex: 1 },
});
