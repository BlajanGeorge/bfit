// Small square thumbnail for an exercise (its animation start pose), or a placeholder icon.
import { Image } from 'expo-image'
import { StyleSheet, View } from 'react-native'

import { Icon } from '@/components/ui/Icon'
import { getExerciseThumb } from '@/data/catalog'
import { useTheme } from '@/hooks/use-theme'

export function ExerciseThumb({ exerciseId, size = 52 }: { exerciseId: string; size?: number }) {
  const c = useTheme()
  const src = getExerciseThumb(exerciseId)
  const box = { width: size, height: size, borderRadius: Math.round(size / 5), backgroundColor: c.background }

  if (src) return <Image source={src} style={box} contentFit="contain" />
  return (
    <View style={[box, styles.empty, { borderColor: c.border }]}>
      <Icon name="figure.strengthtraining.traditional" color={c.textSecondary} size={Math.round(size * 0.4)} />
    </View>
  )
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
})
