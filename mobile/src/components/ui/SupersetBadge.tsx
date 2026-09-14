// Small pill shown on a superset pair, wherever exercises are listed.
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/hooks/use-theme'

export function SupersetBadge() {
  const c = useTheme()
  return (
    <View style={[styles.badge, { backgroundColor: c.background, borderColor: c.primary }]}>
      <Text style={[styles.text, { color: c.primary }]}>SUPERSET</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
})
