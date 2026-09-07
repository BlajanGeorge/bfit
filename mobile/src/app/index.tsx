// Entry gate: send to onboarding on first launch, otherwise straight to Home.
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'

import { getProfile } from '@/data/repo'
import { useTheme } from '@/hooks/use-theme'

export default function Index() {
  const router = useRouter()
  const c = useTheme()

  useEffect(() => {
    let active = true
    getProfile()
      .then((p) => {
        if (!active) return
        router.replace(p ? '/home' : '/onboarding')
      })
      .catch(() => active && router.replace('/onboarding'))
    return () => {
      active = false
    }
  }, [router])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
      <ActivityIndicator color={c.primary} />
    </View>
  )
}
