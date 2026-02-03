'use client';

import Script from 'next/script';
import StreamingHero from '@/components/streaming/StreamingHero';
import TopTenTracks from '@/components/streaming/TopTenTracks';
import ProvincialPlaylists from '@/components/streaming/ProvincialPlaylists';
import GenrePlaylists from '@/components/streaming/GenrePlaylists';

export default function ClassicLandingPage() {
  return (
    <>
      {/* Tawk.to Chat Widget */}
      <Script id='tawk-to' strategy='afterInteractive'>
        {`
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/697b118c2893b51c32bbd5c7/1jg4bp49t';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
          })();
        `}
      </Script>

      <div className='w-full min-h-screen bg-gray-50 dark:bg-slate-900'>
        {/* Streaming Hero */}
        <StreamingHero />

        {/* Top Ten Tracks */}
        <TopTenTracks />

        {/* Provincial Playlists */}
        <ProvincialPlaylists />

        {/* Genre Playlists */}
        <GenrePlaylists />
      </div>
    </>
  );
}
