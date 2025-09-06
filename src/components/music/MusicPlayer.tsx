"use client"

import { useState } from 'react'
import { 
  PlayIcon, 
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline'

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(70)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration] = useState(180) // 3 minutes in seconds

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercentage = (currentTime / duration) * 100

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 dark:bg-slate-800 border-t border-gray-700 dark:border-slate-600 px-4 py-3 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Track Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
            {/* Album art placeholder */}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-white font-medium text-sm truncate">Happier Than Ever</h4>
            <p className="text-gray-400 text-xs truncate">Billie Eilish</p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
          {/* Control Buttons */}
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white transition-colors">
              <ArrowPathIcon className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-white hover:bg-gray-100 text-gray-900 rounded-full p-2 transition-all duration-200 hover:scale-105"
            >
              {isPlaying ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6 ml-0.5" />
              )}
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <ArrowUturnLeftIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-gray-400 text-xs w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 bg-gray-700 rounded-full h-1">
              <div 
                className="bg-white rounded-full h-1 transition-all duration-200"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-gray-400 text-xs w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <button className="text-gray-400 hover:text-white transition-colors">
            {volume > 0 ? (
              <SpeakerWaveIcon className="w-5 h-5" />
            ) : (
              <SpeakerXMarkIcon className="w-5 h-5" />
            )}
          </button>
          <div className="w-20 bg-gray-700 rounded-full h-1">
            <div 
              className="bg-white rounded-full h-1 transition-all duration-200"
              style={{ width: `${volume}%` }}
            />
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
