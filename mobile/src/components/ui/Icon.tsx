// Thin wrapper over SF Symbols (iOS). Falls back to nothing off-iOS.
import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import { Platform, Text } from 'react-native'

export function Icon({
  name,
  size = 22,
  color = '#000',
  weight = 'regular',
}: {
  name: SymbolViewProps['name']
  size?: number
  color?: string
  weight?: SymbolViewProps['weight']
}) {
  if (Platform.OS !== 'ios') {
    return <Text style={{ color, fontSize: size }}>•</Text>
  }
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
    />
  )
}
