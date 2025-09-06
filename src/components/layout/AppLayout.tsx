"use client"

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import MobileHeader from './MobileHeader'
import MusicPlayer from '../music/MusicPlayer'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}
      
      {/* Mobile Header */}
      {isMobile && <MobileHeader />}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${!isMobile ? 'ml-64' : ''}`}>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        
        {/* Music Player - always show */}
        <MusicPlayer />
      </div>
    </div>
  )
}
