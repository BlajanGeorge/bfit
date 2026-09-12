// Exercise detail: muscle group + part, then the looping animation (or a placeholder).
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'

import { Icon } from '@/components/ui/Icon'
import { Screen } from '@/components/ui/Screen'
import { Spacing } from '@/constants/theme'
import { getExercise, getExerciseAnimation } from '@/data/catalog'
import { useTheme } from '@/hooks/use-theme'

export default function ExerciseDetail() {
  const c = useTheme()
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>()
  const ex = getExercise(exerciseId)
  const anim = getExerciseAnimation(exerciseId)

  return (
    <Screen title={ex?.name ?? 'Exercise'} leading="back">
      <Text style={{ color: c.textSecondary, fontSize: 15 }}>
        {ex?.group}
        {ex?.subGroup ? ` · ${ex.subGroup}` : ''}
      </Text>

      <View style={{ height: Spacing.three }} />
      <View style={[styles.anim, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
        {anim ? (
          <Image source={anim} style={styles.animImage} contentFit="contain" autoplay />
        ) : (
          <>
            <Icon name="play.rectangle.fill" color={c.textSecondary} size={48} />
            <Text style={{ color: c.textSecondary, marginTop: Spacing.two }}>Animation coming soon</Text>
          </>
        )}
      </View>

      {ex?.howto && ex.howto.length > 0 && (
        <View style={{ marginTop: Spacing.four }}>
          <Text style={[styles.howtoTitle, { color: c.text }]}>How to execute</Text>
          <View style={{ marginTop: Spacing.two }}>
            {ex.howto.map((step) => (
              <View key={step} style={styles.howtoRow}>
                <Text style={[styles.howtoBullet, { color: c.textSecondary }]}>•</Text>
                <Text style={[styles.howtoStep, { color: c.textSecondary }]}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  anim: {
    height: 280,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  animImage: {
    width: '100%',
    height: '100%',
  },
  howtoTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  howtoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.one,
  },
  howtoBullet: {
    fontSize: 16,
    lineHeight: 22,
    marginRight: Spacing.two,
  },
  howtoStep: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
})
