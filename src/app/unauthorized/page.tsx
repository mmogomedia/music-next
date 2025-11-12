'use client';

import React from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import { ShieldExclamationIcon, HomeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 px-4'>
      <Card className='max-w-md w-full shadow-xl'>
        <CardBody className='p-8 text-center'>
          <div className='flex justify-center mb-6'>
            <div className='w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center'>
              <ShieldExclamationIcon className='w-10 h-10 text-red-600 dark:text-red-400' />
            </div>
          </div>

          <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
            Unauthorized Access
          </h1>

          <p className='text-gray-600 dark:text-gray-400 mb-8'>
            You don&apos;t have permission to access this page. If you believe
            this is an error, please contact support.
          </p>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button
              as={Link}
              href='/'
              color='primary'
              startContent={<HomeIcon className='w-5 h-5' />}
              className='w-full sm:w-auto'
            >
              Go to Homepage
            </Button>
            <Button
              as={Link}
              href='/dashboard'
              variant='bordered'
              className='w-full sm:w-auto'
            >
              Go to Dashboard
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
