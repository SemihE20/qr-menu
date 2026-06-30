'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  useEffect(() => {
    async function test() {
      const { data, error } = await supabase.from('restaurants').select('*')
      console.log('data:', data)
      console.log('error:', error)
    }
    test()
  }, [])

  return <h1>QR Menü Test</h1>
}