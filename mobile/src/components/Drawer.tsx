// Global slide-in left drawer. Rendered once in the root layout, driven by useUi.
import { usePathname, useRouter, type Href } from 'expo-router'
import { useEffect, useRef } from 'react'
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Spacing } from '@/constants/theme'
import { useTheme } from '@/hooks/use-theme'
import { useUi } from '@/store/ui'

import { Icon } from './ui/Icon'
import type { SymbolViewProps } from 'expo-symbols'

const WIDTH = Math.min(300, Dimensions.get('window').width * 0.82)

interface Item {
  label: string
  href: Href
  icon: SymbolViewProps['name']
  match: string
}

const ITEMS: Item[] = [
  { label: 'Home', href: '/home', icon: 'house.fill', match: '/home' },
  { label: 'My Workouts', href: '/workouts', icon: 'square.stack.3d.up.fill', match: '/workouts' },
  { label: 'Exercises', href: '/exercises', icon: 'figure.strengthtraining.traditional', match: '/exercises' },
  { label: 'Metrics', href: '/metrics', icon: 'chart.bar.fill', match: '/metrics' },
  { label: 'Profile', href: '/profile', icon: 'person.fill', match: '/profile' },
]

export function Drawer() {
  const c = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  const open = useUi((s) => s.drawerOpen)
  const close = useUi((s) => s.closeDrawer)

  const tx = useRef(new Animated.Value(-WIDTH)).current
  const fade = useRef(new Animated.Value(0)).current
  const mounted = useRef(false)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(tx, { toValue: open ? 0 : -WIDTH, duration: 220, useNativeDriver: true }),
      Animated.timing(fade, { toValue: open ? 1 : 0, duration: 220, useNativeDriver: true }),
    ]).start()
    if (open) mounted.current = true
  }, [open, tx, fade])

  const go = (href: Href) => {
    close()
    router.push(href)
  }

  return (
    <View pointerEvents={open ? 'auto' : 'none'} style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {
            width: WIDTH,
            backgroundColor: c.background,
            borderRightColor: c.border,
            paddingTop: insets.top + Spacing.three,
            transform: [{ translateX: tx }],
          },
        ]}>
        <View style={styles.brandRow}>
          <View style={[styles.logo, { backgroundColor: c.primary }]}>
            <Icon name="bolt.fill" color={c.onPrimary} size={20} />
          </View>
          <Text style={[styles.brand, { color: c.text }]}>B-Fit</Text>
        </View>

        <View style={{ height: Spacing.four }} />

        {ITEMS.map((it) => {
          const active = pathname.startsWith(it.match)
          return (
            <TouchableOpacity
              key={it.label}
              onPress={() => go(it.href)}
              style={[
                styles.item,
                active && { backgroundColor: c.backgroundSelected },
              ]}>
              <Icon name={it.icon} color={active ? c.primary : c.text} size={22} />
              <Text style={[styles.itemLabel, { color: active ? c.primary : c.text }]}>
                {it.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.two },
  logo: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 22, fontWeight: '800' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    marginBottom: 4,
  },
  itemLabel: { fontSize: 17, fontWeight: '600' },
})
