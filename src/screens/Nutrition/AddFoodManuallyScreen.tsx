import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { LoadingState } from "@/components/ui/LoadingState";
import { useTheme } from "@/theme/useTheme";
import { useNutritionStore } from "@/store/useNutritionStore";
import { lookupBarcode, scaleMacros, type FoodProduct } from "@/services/openFoodFacts";
import type { RootStackParamList } from "@/navigation/types";
import { todayIso } from "@/utils/date";
import { PortionMacros } from "./components/PortionMacros";

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
  const { colors, typography, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "AddFoodManually">>();
  const barcode = route.params?.barcode ?? null;
  const addEntry = useNutritionStore((s) => s.addEntry);

  const [lookingUp, setLookingUp] = useState(Boolean(barcode));
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Portion mode (scanned product): amount scales the per-100 basis.
  const [amountText, setAmountText] = useState("100");

  // Manual mode: the user types the macros for what they actually ate.
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
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
      .then((found) => {
        if (cancelled) return;
        if (!found) {
          setNotFound(true);
          return;
        }
        setProduct(found);
        setName(found.name);
        setBrand(found.brand ?? "");
        setAmountText(String(found.servingSize ?? 100));
      })
      .catch(() => setNotFound(true))
      .finally(() => {
        if (!cancelled) setLookingUp(false);
      });
    return () => {
      cancelled = true;
    };
  }, [barcode]);

  const amount = parseFloat(amountText.replace(",", ".")) || 0;
  const scaled = useMemo(
    () => (product ? scaleMacros(product.per100, amount) : null),
    [product, amount]
  );

  const quickAmounts = useMemo(() => {
    const options = new Set<number>([100]);
    if (product?.servingSize) options.add(product.servingSize);
    options.add(50);
    options.add(200);
    return [...options].sort((a, b) => a - b);
  }, [product]);

  const canSave = name.trim().length > 0 && !saving && (product ? amount > 0 : true);

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);

    const macros = scaled ?? {
      calories: parseFloat(calories) || 0,
      proteinG: parseFloat(protein) || 0,
      carbsG: parseFloat(carbs) || 0,
      fatG: parseFloat(fat) || 0,
    };

    await addEntry({
      date: todayIso(),
      name: name.trim(),
      brand: brand.trim() || null,
      barcode,
      calories: macros.calories,
      proteinG: macros.proteinG,
      carbsG: macros.carbsG,
      fatG: macros.fatG,
      servingDescription: product ? `${amount} ${product.unit}` : null,
      amount: product ? amount : null,
      unit: product?.unit ?? null,
      per100: product?.per100 ?? null,
    });

    setSaving(false);
    close();
  };

  // Opened from a deep link there's no screen underneath, so fall back to the
  // tab this food belongs to rather than leaving the user stuck on the form.
  const close = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("MainTabs", { screen: "Nutrition" });
  };

  if (lookingUp) {
    return (
      <ScreenContainer scroll={false}>
        <LoadingState />
        <Text style={[typography.caption, { color: colors.textSecondary, textAlign: "center" }]}>
          Looking up barcode {barcode}…
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {notFound && (
        <Text style={[typography.caption, { color: colors.danger, marginBottom: spacing.lg }]}>
          That barcode isn't in Open Food Facts — enter the details manually.
        </Text>
      )}

      {product && scaled ? (
        <>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>{product.name}</Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {product.brand ? `${product.brand} · ` : ""}
            {product.per100.calories} kcal per 100 {product.unit}
            {product.servingLabel ? ` · serving ${product.servingLabel}` : ""}
          </Text>

          <View style={{ marginTop: spacing.xl, marginBottom: spacing.lg }}>
            <PortionMacros macros={scaled} amount={amount} unit={product.unit} />
          </View>

          <Text style={[typography.label, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
            {`HOW MUCH? (${product.unit.toUpperCase()})`}
          </Text>
          <TextInput
            value={amountText}
            onChangeText={setAmountText}
            keyboardType="numeric"
            placeholder="100"
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.input,
              styles.amountInput,
              {
                color: colors.textPrimary,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
              },
            ]}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: spacing.md, marginBottom: spacing.xl }}
          >
            {quickAmounts.map((value) => {
              const selected = Math.abs(value - amount) < 0.01;
              return (
                <Pressable
                  key={value}
                  onPress={() => setAmountText(String(value))}
                  style={[
                    styles.pill,
                    {
                      borderRadius: radius.pill,
                      marginRight: spacing.sm,
                      backgroundColor: selected ? `${colors.accent}26` : "transparent",
                      borderColor: selected ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text style={[typography.caption, { color: colors.textPrimary }]}>
                    {value} {product.unit}
                    {value === product.servingSize ? " · 1 serving" : ""}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : (
        <>
          <Field label="NAME" value={name} onChangeText={setName} placeholder="e.g. Greek yogurt" />
          <Field label="BRAND (OPTIONAL)" value={brand} onChangeText={setBrand} placeholder="e.g. Chobani" />
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
        </>
      )}

      <PrimaryButton label="Log food" onPress={onSave} disabled={!canSave} loading={saving} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  amountInput: { fontSize: 22, fontWeight: "700" },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  row: { flexDirection: "row" },
  half: { flex: 1 },
});
