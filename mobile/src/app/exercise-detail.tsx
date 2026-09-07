// Exercise detail: animation placeholder + description (assets come later).
import { useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

import { Card } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Screen } from '@/components/ui/Screen'
import { Spacing } from '@/constants/theme'
import { getExercise } from '@/data/catalog'
import { useTheme } from '@/hooks/use-theme'

export default function ExerciseDetail() {
  const c = useTheme()
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>()
  const ex = getExercise(exerciseId)

  return (
    <Screen title={ex?.name ?? 'Exercise'} leading="back">
      <View style={[styles.anim, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
        <Icon name="play.rectangle.fill" color={c.textSecondary} size={48} />
        <Text style={{ color: c.textSecondary, marginTop: Spacing.two }}>Animation coming soon</Text>
      </View>

      <View style={{ height: Spacing.three }} />
      <Text style={[styles.name, { color: c.text }]}>{ex?.name}</Text>
      <Text style={{ color: c.textSecondary, marginTop: 4 }}>
        {ex?.group}
        {ex?.subGroup ? ` · ${ex.subGroup}` : ''}
      </Text>

      <View style={{ height: Spacing.three }} />
      <Card>
        <Text style={[styles.h, { color: c.text }]}>How to perform</Text>
        <Text style={{ color: c.textSecondary, marginTop: 6, lineHeight: 20 }}>
          A step-by-step description for {ex?.name ?? 'this exercise'} will appear here once
          exercise content is added. Focus on controlled form, a full range of motion, and steady
          breathing throughout each rep.
        </Text>
      </Card>
    </Screen>
  )
}

const styles = StyleSheet.create({
  anim: {
    height: 200,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '800' },
  h: { fontSize: 16, fontWeight: '700' },
})
