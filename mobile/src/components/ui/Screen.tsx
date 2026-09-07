// Standard screen: status-bar-safe app bar (menu or back) + scrollable body.
import { useRouter } from 'expo-router'
import type { ReactNode } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Spacing } from '@/constants/theme'
import { useTheme } from '@/hooks/use-theme'
import { useUi } from '@/store/ui'

import { Icon } from './Icon'

export function Screen({
  title,
  children,
  leading = 'menu',
  onBack,
  rightAction,
  scroll = true,
  contentStyle,
}: {
  title: string
  children: ReactNode
  leading?: 'menu' | 'back' | 'none'
  onBack?: () => void
  rightAction?: ReactNode
  scroll?: boolean
  contentStyle?: object
}) {
  const c = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const openDrawer = useUi((s) => s.openDrawer)

  const handleLeading = () => {
    if (leading === 'menu') openDrawer()
    else if (leading === 'back') (onBack ?? (() => router.back()))()
  }

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={[styles.bar, { borderBottomColor: c.border }]}>
        {leading === 'none' ? (
          <View style={styles.iconBtn} />
        ) : (
          <TouchableOpacity style={styles.iconBtn} onPress={handleLeading} accessibilityLabel={leading}>
            <Icon name={leading === 'menu' ? 'line.3.horizontal' : 'chevron.left'} color={c.text} size={24} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.right}>{rightAction ?? <View style={styles.iconBtn} />}</View>
      </View>

      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            { padding: Spacing.three, paddingBottom: insets.bottom + Spacing.six },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 20, fontWeight: '700' },
  right: { minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
})
