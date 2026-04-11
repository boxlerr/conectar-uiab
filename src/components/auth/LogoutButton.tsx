'use client'

import { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/modulos/autenticacion/AuthContext'

export function LogoutButton() {
  const { logout } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogout() {
    setIsLoading(true)
    await logout()
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
