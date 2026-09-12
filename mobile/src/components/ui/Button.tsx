// Buttons and a card container used across screens.
import type { ReactNode } from 'react'
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native'

import { Spacing } from '@/constants/theme'
import { useTheme } from '@/hooks/use-theme'

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const c = useTheme()
  const bg =
    variant === 'primary' ? c.primary : variant === 'danger' ? c.danger : c.backgroundElement
  const fg =
    variant === 'primary' ? c.onPrimary : variant === 'danger' ? '#fff' : c.text
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor: c.border, opacity: disabled ? 0.4 : 1 },
        variant === 'secondary' && { borderWidth: StyleSheet.hairlineWidth },
        style,
      ]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </TouchableOpacity>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useTheme()
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.backgroundElement, borderColor: c.border },
        style,
      ]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  label: { fontSize: 16, fontWeight: '700' },
  card: {
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
})
