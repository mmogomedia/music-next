'use client';

export default function TimelineSidebar() {
  return (
    <div className='p-6'>
      {/* Promote Your Music */}
      <div className='bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/30 dark:via-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50 shadow-lg'>
        <div className='mb-4'>
          <div className='w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-3'>
            <svg
              className='w-6 h-6 text-white'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
              />
            </svg>
          </div>
          <h4 className='font-bold text-gray-900 dark:text-white mb-2'>
            Promote Your Music
          </h4>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Reach more listeners with featured placement
          </p>
        </div>
        <button className='w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg'>
          Learn More
        </button>
      </div>
    </div>
  );
}
