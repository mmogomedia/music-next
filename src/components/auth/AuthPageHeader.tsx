import Link from 'next/link';
import Image from 'next/image';

export default function AuthPageHeader() {
  return (
    <div className='text-center mb-4'>
      <Link href='/' className='inline-block'>
        <Image
          src='/main_logo.png'
          alt='Flemoji'
          width={200}
          height={60}
          priority
          className='h-10 w-auto mx-auto'
        />
      </Link>
    </div>
  );
}

