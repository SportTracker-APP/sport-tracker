import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type TopographicAccentProps = {
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function TopographicAccent({
  color = 'rgba(255, 255, 255, 0.16)',
  style,
}: TopographicAccentProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[styles.frame, style]}
    >
      <View style={[styles.ring, styles.outer, { borderColor: color }]} />
      <View style={[styles.ring, styles.middle, { borderColor: color }]} />
      <View style={[styles.ring, styles.inner, { borderColor: color }]} />
      <View style={[styles.ring, styles.core, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    width: 220,
    height: 176,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 999,
  },
  outer: {
    width: 220,
    height: 176,
    left: 0,
    top: 0,
    transform: [{ rotate: '-5deg' }],
  },
  middle: {
    width: 174,
    height: 132,
    left: 24,
    top: 22,
    transform: [{ rotate: '7deg' }],
  },
  inner: {
    width: 126,
    height: 90,
    left: 48,
    top: 43,
    transform: [{ rotate: '-8deg' }],
  },
  core: {
    width: 72,
    height: 48,
    left: 75,
    top: 64,
    transform: [{ rotate: '10deg' }],
  },
});
