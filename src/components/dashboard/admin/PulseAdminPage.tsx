'use client';

import { useState } from 'react';
import AdminNavigation from './AdminNavigation';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import PulseOverview from './pulse/PulseOverview';
import PulseLogsAndRuns from './pulse/PulseLogsAndRuns';
import PulseTierManagement from './pulse/PulseTierManagement';
import PulseArtistManagement from './pulse/PulseArtistManagement';
import PulseEligibilityScores from './pulse/PulseEligibilityScores';
import PulsePlatformData from './pulse/PulsePlatformData';
import PulseMonitoring from './pulse/PulseMonitoring';
import {
  ChartBarIcon,
  DocumentTextIcon,
  TrophyIcon,
  UserGroupIcon,
  CalculatorIcon,
  CloudIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

type PulseTab =
  | 'overview'
  | 'logs'
  | 'tiers'
  | 'artists'
  | 'scores'
  | 'platform'
  | 'monitoring';

export default function PulseAdminPage() {
  const { stats } = useAdminDashboardStats();
  const systemHealth = stats?.systemMetrics?.platformHealth || 'healthy';
  const [activeTab, setActiveTab] = useState<PulseTab>('overview');

  const tabs = [
    { id: 'overview' as PulseTab, name: 'Overview', icon: ChartBarIcon },
    { id: 'logs' as PulseTab, name: 'Logs & Runs', icon: DocumentTextIcon },
    { id: 'tiers' as PulseTab, name: 'Tiers', icon: TrophyIcon },
    {
      id: 'artists' as PulseTab,
      name: 'Artists in Tiers',
      icon: UserGroupIcon,
    },
    {
      id: 'scores' as PulseTab,
      name: 'Eligibility Scores',
      icon: CalculatorIcon,
    },
    { id: 'platform' as PulseTab, name: 'Platform Data', icon: CloudIcon },
    { id: 'monitoring' as PulseTab, name: 'Monitoring', icon: EyeIcon },
  ];

  const header = (
    <header className='bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-b border-gray-200 dark:border-slate-700'>
      <div className='py-3 px-4 sm:px-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400'>
              PULSE³ Management
            </h1>
            <p className='mt-0.5 text-xs text-gray-600 dark:text-gray-400'>
              Eligibility scores • League tiers • Runs & monitoring
            </p>
          </div>
        </div>
      </div>
    </header>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <PulseOverview />;
      case 'logs':
        return <PulseLogsAndRuns />;
      case 'tiers':
        return <PulseTierManagement />;
      case 'artists':
        return <PulseArtistManagement />;
      case 'scores':
        return <PulseEligibilityScores />;
      case 'platform':
        return <PulsePlatformData />;
      case 'monitoring':
        return <PulseMonitoring />;
      default:
        return <PulseOverview />;
    }
  };

  return (
    <UnifiedLayout
      sidebar={<AdminNavigation systemHealth={systemHealth} />}
      header={header}
    >
      <div className='w-full bg-gray-50 dark:bg-slate-900'>
        {/* Tab Navigation */}
        <div className='bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm'>
          <div className='px-4 sm:px-6'>
            <nav className='flex space-x-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap
                      transition-all duration-200 rounded-t-lg relative
                      ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }
                    `}
                  >
                    <Icon
                      className={`h-4 w-4 ${isActive ? 'scale-110' : ''} transition-transform`}
                    />
                    <span>{tab.name}</span>
                    {isActive && (
                      <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full' />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className='py-4 px-4 sm:px-6'>{renderTabContent()}</div>
      </div>
    </UnifiedLayout>
  );
}
