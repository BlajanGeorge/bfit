// Browse exercises per muscle group (drawer entry). Tapping a group lists them.
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { Screen } from '@/components/ui/Screen'
import { Spacing } from '@/constants/theme'
import { MUSCLE_GROUPS, MUSCLE_IMAGES, exercisesForGroup } from '@/data/catalog'
import { useTheme } from '@/hooks/use-theme'

export default function Exercises() {
  const c = useTheme()
  const router = useRouter()

  return (
    <Screen title="Exercises">
      <View style={styles.grid}>
        {MUSCLE_GROUPS.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.card, { backgroundColor: c.backgroundElement, borderColor: c.border }]}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/pick-exercise', params: { group: g, browse: '1' } })}>
            <Image source={MUSCLE_IMAGES[g]} style={styles.img} contentFit="cover" transition={120} />
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: c.text }]}>{g}</Text>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>{exercisesForGroup(g).length}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'space-between' },
  card: { width: '48.5%', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: Spacing.two },
  img: { width: '100%', height: 120, backgroundColor: '#00000010' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.two },
  label: { fontSize: 15, fontWeight: '700' },
})
