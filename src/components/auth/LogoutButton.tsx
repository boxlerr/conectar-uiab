'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  async function handleLogout() {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      toast.success('Sesión finalizada', { description: 'Has salido de forma segura.' })
      router.push('/')
      router.refresh()
    } catch (err: any) {
      toast.error('Error al salir', { description: 'Hubo un problema cerrando tu sesión.' })
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      onClick={handleLogout} 
      disabled={isLoading}
      className="text-slate-500 hover:text-slate-900 border border-slate-200 hover:bg-slate-100 px-4 h-9 font-medium"
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
      Cerrar Sesión
    </Button>
  )
}
