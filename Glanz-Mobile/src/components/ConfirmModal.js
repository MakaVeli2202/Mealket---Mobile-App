import React, { useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from './SafeGradient';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, Easing,
} from 'react-native-reanimated';

const { width: W } = Dimensions.get('window');

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = '#FF453A',
  iconName = 'close-circle-outline',
  iconColor = '#FF453A',
  onConfirm,
  onCancel,
  theme,
}) {
  const scale = useSharedValue(0.88);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
    } else {
      scale.value = withTiming(0.88, { duration: 160 });
      opacity.value = withTiming(0, { duration: 160 });
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal transparent visible={visible} onRequestClose={onCancel} animationType="none" statusBarTranslucent>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onCancel}>
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.55)' }]} />
      </TouchableOpacity>

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, cardStyle]}>
          <LinearGradient
            colors={[confirmColor + '22', 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
          />

          <View style={[styles.iconWrap, { backgroundColor: confirmColor + '18', borderColor: confirmColor + '40' }]}>
            <Ionicons name={iconName} size={32} color={iconColor} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {!!message && <Text style={[styles.message, { color: theme.textSub }]}>{message}</Text>}

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
              onPress={onCancel}
              activeOpacity={0.75}
            >
              <Text style={[styles.btnText, { color: theme.textSub }]}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn, { backgroundColor: confirmColor + '18', borderColor: confirmColor + '60' }]}
              onPress={onConfirm}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={[confirmColor + 'CC', confirmColor]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
              />
              <Text style={[styles.btnText, { color: '#FFF', fontWeight: '800' }]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: W - 48,
    borderRadius: 28,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 24,
  },
  iconWrap: {
    width: 68, height: 68, borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3, textAlign: 'center' },
  message: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  btn: {
    flex: 1, height: 50, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  cancelBtn: {},
  confirmBtn: {},
  btnText: { fontSize: 15, fontWeight: '700' },
});
