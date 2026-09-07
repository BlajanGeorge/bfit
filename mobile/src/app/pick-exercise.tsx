// List exercises for a chosen group. In builder flow -> configure; in browse -> detail.
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { Icon } from '@/components/ui/Icon'
import { Screen } from '@/components/ui/Screen'
import { Spacing } from '@/constants/theme'
import { exercisesForGroup } from '@/data/catalog'
import type { MuscleGroup } from '@/domain/types'
import { useTheme } from '@/hooks/use-theme'

export default function PickExercise() {
  const c = useTheme()
  const router = useRouter()
  const { group, browse } = useLocalSearchParams<{ group: MuscleGroup; browse?: string }>()
  const list = exercisesForGroup(group)
  const isBrowse = browse === '1'

  const onPick = (id: string) => {
    if (isBrowse) router.push({ pathname: '/exercise-detail', params: { exerciseId: id } })
    else router.push({ pathname: '/configure-exercise', params: { exerciseId: id } })
  }

  return (
    <Screen title={group} leading="back">
      <View style={{ gap: Spacing.two }}>
        {list.map((e) => (
          <TouchableOpacity
            key={e.id}
            activeOpacity={0.85}
            onPress={() => onPick(e.id)}
            style={[styles.row, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: c.text }]}>{e.name}</Text>
              {e.subGroup ? (
                <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 2 }}>{e.subGroup}</Text>
              ) : null}
            </View>
            <Icon name={isBrowse ? 'chevron.right' : 'plus.circle.fill'} color={isBrowse ? c.textSecondary : c.primary} size={isBrowse ? 16 : 24} />
          </TouchableOpacity>
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  name: { fontSize: 16, fontWeight: '600' },
})
