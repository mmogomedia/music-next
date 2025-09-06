"use client"

import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { Card, CardBody, Button, Tabs, Tab } from '@heroui/react'
import { 
  MusicalNoteIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  HeartIcon,
  PlayIcon,
  PlusIcon,
  EyeIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon,
  PauseIcon
} from '@heroicons/react/24/outline'
import { 
  PlayIcon as PlaySolidIcon,
  HeartIcon as HeartSolidIcon
} from '@heroicons/react/24/solid'
import FileUpload from '@/components/upload/FileUpload'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data - replace with real data from your database
  const stats = {
    totalTracks: 24,
    totalPlays: 125430,
    totalLikes: 8932,
    totalRevenue: 1247.50
  }

  const recentTracks = [
    {
      id: '1',
      title: 'Midnight Dreams',
      artist: session?.user?.name || 'You',
      duration: 180,
      plays: 15420,
      likes: 892,
      isPlaying: false
    },
    {
      id: '2',
      title: 'Summer Vibes',
      artist: session?.user?.name || 'You',
      duration: 220,
      plays: 12300,
      likes: 756,
      isPlaying: true
    },
    {
      id: '3',
      title: 'Electric Pulse',
      artist: session?.user?.name || 'You',
      duration: 195,
      plays: 8900,
      likes: 634,
      isPlaying: false
    }
  ]

  const tabs = [
    { id: 'overview', name: 'Overview', icon: MusicalNoteIcon },
    { id: 'upload', name: 'Upload Music', icon: PlusIcon },
    { id: 'library', name: 'My Music', icon: MusicalNoteIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon }
  ]

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-slate-900 overflow-hidden">
      {/* Floating Upload Button - Always Accessible */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          size="lg"
          className="shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
          startContent={<PlusIcon className="w-5 h-5" />}
          onClick={() => setActiveTab('upload')}
        >
          <span className="hidden sm:block">Upload Music</span>
        </Button>
      </div>

      {/* Header Section */}
      <section className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, <span className="text-gradient bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">{session?.user?.name || 'Artist'}</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Manage your music and track your performance
            </p>
          </div>
          <Button 
            size="lg"
            className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            startContent={<PlusIcon className="w-5 h-5" />}
            onClick={() => setActiveTab('upload')}
          >
            Upload Music
          </Button>
        </div>

        {/* Navigation Tabs */}
        <Card className="mb-8">
          <CardBody className="p-2">
            <Tabs 
              selectedKey={activeTab} 
              onSelectionChange={(key) => setActiveTab(key as string)}
              className="w-full"
              classNames={{
                tabList: "gap-2 w-full relative rounded-lg p-1 bg-content2",
                cursor: "w-full bg-blue-600 shadow-lg",
                tab: "max-w-fit px-4 py-3 h-12",
                tabContent: "group-data-[selected=true]:text-white text-gray-500 dark:text-gray-400"
              }}
            >
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Tab 
                    key={tab.id}
                    title={
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {tab.name}
                      </div>
                    }
                  />
                )
              })}
            </Tabs>
          </CardBody>
        </Card>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass  transition-all duration-500  group">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      <MusicalNoteIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold">
                      <span>+12%</span>
                    </div>
                  </div>
                  <div className="text-4xl font-bold mb-2 group-hover:text-blue-600 transition-colors duration-300">{stats.totalTracks}</div>
                  <div className="text-foreground/60 text-sm font-medium">Total Tracks</div>
                  <div className="text-xs text-foreground/40 mt-1">+2 this month</div>
                </CardBody>
              </Card>

              <Card className="glass  transition-all duration-500  group">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      <PlaySolidIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold">
                      <span>+8.3%</span>
                    </div>
                  </div>
                  <div className="text-4xl font-bold mb-2 group-hover:text-blue-600 transition-colors duration-300">{stats.totalPlays.toLocaleString()}</div>
                  <div className="text-foreground/60 text-sm font-medium">Total Plays</div>
                  <div className="text-xs text-foreground/40 mt-1">15,420 this month</div>
                </CardBody>
              </Card>

              <Card className="glass  transition-all duration-500  group">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      <HeartSolidIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold">
                      <span>+15.2%</span>
                    </div>
                  </div>
                  <div className="text-4xl font-bold mb-2 group-hover:text-blue-600 transition-colors duration-300">{stats.totalLikes.toLocaleString()}</div>
                  <div className="text-foreground/60 text-sm font-medium">Total Likes</div>
                  <div className="text-xs text-foreground/40 mt-1">892 this month</div>
                </CardBody>
              </Card>

              <Card className="glass  transition-all duration-500  group">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      <span className="text-white font-bold text-lg">$</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 text-sm font-semibold">
                      <span>+24.1%</span>
                    </div>
                  </div>
                  <div className="text-4xl font-bold mb-2 group-hover:text-blue-600 transition-colors duration-300">${stats.totalRevenue.toLocaleString()}</div>
                  <div className="text-foreground/60 text-sm font-medium">Total Revenue</div>
                  <div className="text-xs text-foreground/40 mt-1">$247.50 this month</div>
                </CardBody>
              </Card>
            </div>

            {/* Recent Tracks */}
            <Card className="glass  transition-all duration-500">
              <CardBody className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Tracks</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your latest uploads and their performance</p>
                  </div>
                  <Button 
                    variant="light"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => setActiveTab('library')}
                  >
                    View All
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {recentTracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-content2 hover:bg-content3 transition-all duration-300 hover:shadow-lg group"
                    >
                      <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                        {track.isPlaying ? (
                          <PauseIcon className="w-7 h-7 text-white" />
                        ) : (
                          <PlayIcon className="w-7 h-7 text-white ml-0.5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors duration-300">{track.title}</h3>
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-blue-600 font-semibold">+12.5%</span>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/60 mb-2">{track.artist}</p>
                        <div className="flex items-center gap-6 text-sm text-foreground/60">
                          <span className="flex items-center gap-2">
                            <PlaySolidIcon className="w-4 h-4" />
                            {track.plays.toLocaleString()} plays
                          </span>
                          <span className="flex items-center gap-2">
                            <HeartSolidIcon className="w-4 h-4" />
                            {track.likes.toLocaleString()} likes
                          </span>
                          <span className="font-medium">{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          isIconOnly 
                          variant="light" 
                          size="sm"
                          className="hover:bg-blue-100 hover:text-blue-600 transition-all duration-300"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button 
                          isIconOnly 
                          variant="light" 
                          size="sm"
                          className="hover:bg-blue-100 hover:text-blue-600 transition-all duration-300"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button 
                          isIconOnly 
                          variant="light" 
                          size="sm"
                          className="hover:bg-blue-100 hover:text-blue-600 transition-all duration-300"
                        >
                          <ShareIcon className="w-4 h-4" />
                        </Button>
                        <Button 
                          isIconOnly 
                          variant="light" 
                          size="sm"
                          className="hover:bg-red-100 hover:text-red-600 transition-all duration-300"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="glass  transition-all duration-500 group">
                <CardBody className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      <PlusIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors duration-300">Upload New Track</h3>
                      <p className="text-sm text-foreground/60">Share your latest music with the world</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setActiveTab('upload')}
                  >
                    Upload Music
                  </Button>
                </CardBody>
              </Card>

              <Card className="glass  transition-all duration-500 group">
                <CardBody className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      <ChartBarIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors duration-300">View Analytics</h3>
                      <p className="text-sm text-foreground/60">Track your performance and growth</p>
                    </div>
                  </div>
                  <Button 
                    variant="bordered"
                    className="w-full font-semibold border-2 border-blue-500 hover:border-blue-600 hover:bg-blue-500/10 text-blue-600 hover:text-blue-700 transition-all duration-300 hover:scale-105"
                    onClick={() => setActiveTab('analytics')}
                  >
                    View Analytics
                  </Button>
                </CardBody>
              </Card>

              <Card className="glass  transition-all duration-500 group">
                <CardBody className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      <ShareIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-blue-600 transition-colors duration-300">Create Smart Links</h3>
                      <p className="text-sm text-foreground/60">Generate cross-platform sharing links</p>
                    </div>
                  </div>
                  <Button 
                    className="w-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Create Links
                  </Button>
                </CardBody>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <Card className="glass transition-all duration-500">
            <CardBody className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Upload New Music</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Upload your music files with real-time progress tracking and cloud storage.
              </p>
              <FileUpload onUploadComplete={(jobId) => {
                console.log('Upload completed:', jobId)
                // You can add additional logic here, like refreshing the library
              }} />
            </CardBody>
          </Card>
        )}

        {activeTab === 'library' && (
          <Card className="glass  transition-all duration-500">
            <CardBody className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Music Library</h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    {recentTracks.length} track{recentTracks.length !== 1 ? 's' : ''} in your library
                  </p>
                </div>
                <Button 
                  size="lg" 
                  startContent={<PlusIcon className="w-5 h-5" />}
                  className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setActiveTab('upload')}
                >
                  Upload New
                </Button>
              </div>
              
              <div className="space-y-4">
                {recentTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-content2 hover:bg-content3 transition-all duration-300 hover:shadow-lg group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                      {track.isPlaying ? (
                        <PauseIcon className="w-7 h-7 text-white" />
                      ) : (
                        <PlayIcon className="w-7 h-7 text-white ml-0.5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors duration-300">{track.title}</h3>
                      <p className="text-sm text-foreground/60 mb-2">{track.artist}</p>
                      <div className="flex items-center gap-6 text-sm text-foreground/60">
                        <span className="flex items-center gap-2">
                          <PlaySolidIcon className="w-4 h-4" />
                          {track.plays.toLocaleString()} plays
                        </span>
                        <span className="flex items-center gap-2">
                          <HeartSolidIcon className="w-4 h-4" />
                          {track.likes.toLocaleString()} likes
                        </span>
                        <span className="font-medium">{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        isIconOnly 
                        variant="light" 
                        size="sm"
                        className="hover:bg-blue-100 hover:text-blue-600 transition-all duration-300"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button 
                        isIconOnly 
                        variant="light" 
                        size="sm"
                        className="hover:bg-blue-100 hover:text-blue-600 transition-all duration-300"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button 
                        isIconOnly 
                        variant="light" 
                        size="sm"
                        className="hover:bg-blue-100 hover:text-blue-600 transition-all duration-300"
                      >
                        <ShareIcon className="w-4 h-4" />
                      </Button>
                    <Button 
                      isIconOnly 
                      variant="light" 
                        size="sm"
                        className="hover:bg-red-100 hover:text-red-600 transition-all duration-300"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === 'analytics' && (
          <Card className="glass  transition-all duration-500">
            <CardBody className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analytics Overview</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Track your music performance and audience</p>
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <ChartBarIcon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Analytics Coming Soon</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Detailed charts and metrics will be displayed here to help you track your music performance
                </p>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
