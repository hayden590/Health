import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useTheme } from "@/theme/useTheme";
import type { RootStackParamList } from "@/navigation/types";

export function BarcodeScannerScreen() {
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);
  const [torch, setTorch] = useState(false);

  const onScanned = useCallback(
    (result: { data: string }) => {
      if (scannedRef.current) return;
      scannedRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      navigation.replace("AddFoodManually", { barcode: result.data });
    },
    [navigation]
  );

  if (!permission) {
    return <View style={[styles.flex, { backgroundColor: "#000" }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: colors.background, padding: spacing.xl }]}>
        <Ionicons name="camera-outline" size={40} color={colors.textSecondary} />
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, textAlign: "center", marginVertical: spacing.lg },
          ]}
        >
          Vitalis needs camera access to scan food barcodes.
        </Text>
        <PrimaryButton label="Allow camera access" onPress={requestPermission} />
        <View style={{ marginTop: spacing.md }}>
          <PrimaryButton label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView
        style={styles.flex}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
        }}
        onBarcodeScanned={onScanned}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={[styles.topBar, { paddingTop: spacing.xxl }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <Pressable onPress={() => setTorch((t) => !t)} hitSlop={12}>
            <Ionicons name={torch ? "flash" : "flash-off"} size={26} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.frame} />
        <Text style={[typography.body, styles.hint]}>Align the barcode within the frame</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 24,
  },
  frame: {
    width: 260,
    height: 160,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#3DD6C4",
  },
  hint: { color: "#fff", marginBottom: 60 },
});
