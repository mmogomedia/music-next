'use client';

import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  MusicalNoteIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
} from '@heroicons/react/24/outline';

export default function SearchSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const searchSuggestions = [
    { icon: MusicalNoteIcon, text: 'Amapiano Hits', type: 'Genre' },
    { icon: MicrophoneIcon, text: 'Cape Town Artists', type: 'Artist' },
    { icon: SpeakerWaveIcon, text: 'Deep House', type: 'Genre' },
    { icon: MusicalNoteIcon, text: 'Afrobeat', type: 'Genre' },
  ];

  return (
    <div className='py-16 bg-gradient-to-b from-slate-800 to-slate-900'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h2 className='text-3xl lg:text-4xl font-bold text-white mb-4 font-["Poppins"] text-gradient'>
            Find Your Next Favorite Song
          </h2>
          <p className='text-xl text-slate-300 font-["Poppins"]'>
            Search through thousands of tracks from South African artists
          </p>
        </div>

        {/* Search Bar */}
        <div className='relative max-w-2xl mx-auto'>
          <div
            className={`relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border transition-all duration-300 ${
              isFocused
                ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                : 'border-slate-700'
            }`}
          >
            <div className='absolute left-6 top-1/2 transform -translate-y-1/2'>
              <MagnifyingGlassIcon
                className={`w-6 h-6 transition-colors duration-200 ${
                  isFocused ? 'text-blue-400' : 'text-slate-400'
                }`}
              />
            </div>

            <input
              type='text'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder='Search for songs, artists, or albums...'
              className='w-full pl-16 pr-6 py-6 bg-transparent text-white placeholder-slate-400 text-lg focus:outline-none rounded-2xl'
            />

            {/* Search Button */}
            <button className='absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg'>
              Search
            </button>
          </div>

          {/* Search Suggestions */}
          {isFocused && (
            <div className='absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-2xl z-50'>
              <div className='p-4'>
                <h4 className='text-sm font-semibold text-slate-300 mb-3'>
                  Popular Searches
                </h4>
                <div className='space-y-2'>
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className='w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors duration-200 text-left'
                      onClick={() => setSearchQuery(suggestion.text)}
                    >
                      <suggestion.icon className='w-5 h-5 text-slate-400' />
                      <div>
                        <div className='text-white font-medium'>
                          {suggestion.text}
                        </div>
                        <div className='text-sm text-slate-400'>
                          {suggestion.type}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className='mt-16 grid grid-cols-1 md:grid-cols-3 gap-8'>
          <div className='text-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
              <MusicalNoteIcon className='w-8 h-8 text-white' />
            </div>
            <h3 className='text-2xl font-bold text-white mb-2'>10,000+</h3>
            <p className='text-slate-400'>Songs Available</p>
          </div>

          <div className='text-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
              <MicrophoneIcon className='w-8 h-8 text-white' />
            </div>
            <h3 className='text-2xl font-bold text-white mb-2'>500+</h3>
            <p className='text-slate-400'>South African Artists</p>
          </div>

          <div className='text-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
              <SpeakerWaveIcon className='w-8 h-8 text-white' />
            </div>
            <h3 className='text-2xl font-bold text-white mb-2'>50+</h3>
            <p className='text-slate-400'>Curated Playlists</p>
          </div>
        </div>
      </div>
    </div>
  );
}
