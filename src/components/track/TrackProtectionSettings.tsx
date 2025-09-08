'use client';

import React, { useState } from 'react';
import {
  Card,
  CardBody,
  Switch,
  Input,
  Select,
  SelectItem,
  Chip,
  Button,
} from '@heroui/react';
import {
  ShieldCheckIcon,
  GlobeAltIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  PlayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  ProtectionSettings,
  DEFAULT_PROTECTION_SETTINGS,
} from '@/lib/file-protection';

interface TrackProtectionSettingsProps {
  settings: ProtectionSettings;
  onSettingsChange: (_settings: ProtectionSettings) => void;
  disabled?: boolean;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'RU', name: 'Russia' },
  { code: 'KR', name: 'South Korea' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

export default function TrackProtectionSettings({
  settings,
  onSettingsChange,
  disabled = false,
}: TrackProtectionSettingsProps) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    settings.geoBlocking
  );

  const handleSettingChange = (key: keyof ProtectionSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const handleNestedSettingChange = (
    parentKey: keyof ProtectionSettings,
    childKey: string,
    value: any
  ) => {
    onSettingsChange({
      ...settings,
      [parentKey]: {
        ...(settings[parentKey] as any),
        [childKey]: value,
      },
    });
  };

  const handleCountryToggle = (countryCode: string) => {
    const newCountries = selectedCountries.includes(countryCode)
      ? selectedCountries.filter(c => c !== countryCode)
      : [...selectedCountries, countryCode];

    setSelectedCountries(newCountries);
    handleSettingChange('geoBlocking', newCountries);
  };

  const resetToDefaults = () => {
    onSettingsChange(DEFAULT_PROTECTION_SETTINGS);
    setSelectedCountries([]);
  };

  return (
    <div className='space-y-6'>
      {/* Watermarking */}
      <Card>
        <CardBody className='p-4'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <ShieldCheckIcon className='w-5 h-5 text-blue-600' />
              <div>
                <h4 className='font-medium text-gray-900 dark:text-white'>
                  Audio Watermarking
                </h4>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Embed invisible tracking markers in audio
                </p>
              </div>
            </div>
            <Switch
              isSelected={settings.watermarking}
              onValueChange={value =>
                handleSettingChange('watermarking', value)
              }
              isDisabled={disabled}
            />
          </div>
        </CardBody>
      </Card>

      {/* Geo-blocking */}
      <Card>
        <CardBody className='p-4'>
          <div className='flex items-center gap-3 mb-4'>
            <GlobeAltIcon className='w-5 h-5 text-green-600' />
            <div>
              <h4 className='font-medium text-gray-900 dark:text-white'>
                Geographic Restrictions
              </h4>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Block access from specific countries
              </p>
            </div>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
            {COUNTRIES.map(country => (
              <Chip
                key={country.code}
                variant={
                  selectedCountries.includes(country.code) ? 'solid' : 'flat'
                }
                color={
                  selectedCountries.includes(country.code)
                    ? 'danger'
                    : 'default'
                }
                className='cursor-pointer'
                onClick={() => !disabled && handleCountryToggle(country.code)}
              >
                {country.name}
              </Chip>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Time Restrictions */}
      <Card>
        <CardBody className='p-4'>
          <div className='flex items-center gap-3 mb-4'>
            <ClockIcon className='w-5 h-5 text-orange-600' />
            <div>
              <h4 className='font-medium text-gray-900 dark:text-white'>
                Time Restrictions
              </h4>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Limit access to specific time periods
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Input
              type='time'
              label='Start Time'
              value={settings.timeRestrictions.startTime || ''}
              onValueChange={value =>
                handleNestedSettingChange(
                  'timeRestrictions',
                  'startTime',
                  value
                )
              }
              isDisabled={disabled}
            />
            <Input
              type='time'
              label='End Time'
              value={settings.timeRestrictions.endTime || ''}
              onValueChange={value =>
                handleNestedSettingChange('timeRestrictions', 'endTime', value)
              }
              isDisabled={disabled}
            />
            <Select
              label='Timezone'
              selectedKeys={[settings.timeRestrictions.timezone]}
              onSelectionChange={keys => {
                const selected = Array.from(keys)[0] as string;
                handleNestedSettingChange(
                  'timeRestrictions',
                  'timezone',
                  selected
                );
              }}
              isDisabled={disabled}
            >
              {TIMEZONES.map(tz => (
                <SelectItem key={tz}>{tz}</SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Device Limits */}
      <Card>
        <CardBody className='p-4'>
          <div className='flex items-center gap-3 mb-4'>
            <DevicePhoneMobileIcon className='w-5 h-5 text-purple-600' />
            <div>
              <h4 className='font-medium text-gray-900 dark:text-white'>
                Device Access
              </h4>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Control which devices can access content
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <DevicePhoneMobileIcon className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                  Allow Mobile
                </span>
              </div>
              <Switch
                isSelected={settings.deviceLimits.allowMobile}
                onValueChange={value =>
                  handleNestedSettingChange(
                    'deviceLimits',
                    'allowMobile',
                    value
                  )
                }
                isDisabled={disabled}
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <ComputerDesktopIcon className='w-4 h-4 text-gray-500' />
                <span className='text-sm text-gray-700 dark:text-gray-300'>
                  Allow Desktop
                </span>
              </div>
              <Switch
                isSelected={settings.deviceLimits.allowDesktop}
                onValueChange={value =>
                  handleNestedSettingChange(
                    'deviceLimits',
                    'allowDesktop',
                    value
                  )
                }
                isDisabled={disabled}
              />
            </div>

            <Input
              type='number'
              label='Max Devices'
              value={settings.deviceLimits.maxDevices.toString()}
              onValueChange={value =>
                handleNestedSettingChange(
                  'deviceLimits',
                  'maxDevices',
                  parseInt(value) || 5
                )
              }
              isDisabled={disabled}
              min={1}
              max={10}
            />
          </div>
        </CardBody>
      </Card>

      {/* Streaming Limits */}
      <Card>
        <CardBody className='p-4'>
          <div className='flex items-center gap-3 mb-4'>
            <PlayIcon className='w-5 h-5 text-red-600' />
            <div>
              <h4 className='font-medium text-gray-900 dark:text-white'>
                Streaming Limits
              </h4>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Control how content can be streamed
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Input
              type='number'
              label='Max Simultaneous Streams'
              value={settings.streamingLimits.maxSimultaneousStreams.toString()}
              onValueChange={value =>
                handleNestedSettingChange(
                  'streamingLimits',
                  'maxSimultaneousStreams',
                  parseInt(value) || 3
                )
              }
              isDisabled={disabled}
              min={1}
              max={10}
            />
            <Input
              type='number'
              label='Max Plays Per Day'
              value={settings.streamingLimits.maxPlaysPerDay.toString()}
              onValueChange={value =>
                handleNestedSettingChange(
                  'streamingLimits',
                  'maxPlaysPerDay',
                  parseInt(value) || 100
                )
              }
              isDisabled={disabled}
              min={1}
              max={1000}
            />
            <Input
              type='number'
              label='Max Plays Per Week'
              value={settings.streamingLimits.maxPlaysPerWeek.toString()}
              onValueChange={value =>
                handleNestedSettingChange(
                  'streamingLimits',
                  'maxPlaysPerWeek',
                  parseInt(value) || 500
                )
              }
              isDisabled={disabled}
              min={1}
              max={5000}
            />
          </div>
        </CardBody>
      </Card>

      {/* Reset Button */}
      <div className='flex justify-end'>
        <Button
          variant='light'
          color='default'
          onPress={resetToDefaults}
          isDisabled={disabled}
          startContent={<ExclamationTriangleIcon className='w-4 h-4' />}
        >
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
