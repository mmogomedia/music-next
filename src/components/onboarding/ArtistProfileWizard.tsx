'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@heroui/react';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import ClaimProfileStep from './steps/ClaimProfileStep';
import BasicInfoStep from './steps/BasicInfoStep';
import DetailsStep from './steps/DetailsStep';
import ReviewStep from './steps/ReviewStep';

export interface WizardFormData {
  // Claim Profile Step
  claimedProfileId: string | null;

  // Basic Info Step
  artistName: string;
  genreId: string;

  // Details Step
  bio: string;
  country: string;
  province: string;
  city: string;
  website: string;
  skillIds: string[];

  // Image Step
  profileImage: string;
  coverImage: string;
}

const TOTAL_STEPS = 4;

export default function ArtistProfileWizard() {
  const router = useRouter();
  const { status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>({
    claimedProfileId: null,
    artistName: '',
    genreId: '',
    bio: '',
    country: '',
    province: '',
    city: '',
    website: '',
    skillIds: [],
    profileImage: '',
    coverImage: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load claimed profile data when a profile is claimed
  useEffect(() => {
    const loadClaimedProfile = async () => {
      if (formData.claimedProfileId && status === 'authenticated') {
        try {
          const response = await fetch('/api/artist-profile');
          if (response.ok) {
            const data = await response.json();
            const profile = data.artistProfile;
            if (profile) {
              // Pre-fill form with existing profile data
              setFormData(prev => ({
                ...prev,
                artistName: profile.artistName || prev.artistName,
                genreId: profile.genreId || prev.genreId,
                bio: profile.bio || prev.bio,
                country: profile.country || prev.country,
                province: profile.province || prev.province,
                city: profile.city || prev.city,
                website: profile.website || prev.website,
                profileImage: profile.profileImage || prev.profileImage,
                coverImage: profile.coverImage || prev.coverImage,
                skillIds:
                  profile.skills?.map((s: any) => s.skillId || s.skill?.id) ||
                  prev.skillIds,
              }));
              // Auto-advance to next step after loading
              if (currentStep === 0) {
                setCurrentStep(1);
              }
            }
          }
        } catch (error) {
          console.error('Error loading claimed profile:', error);
        }
      }
    };

    loadClaimedProfile();
  }, [formData.claimedProfileId, status, currentStep]);

  // Only show loading during initial auth check, not during normal navigation
  if (status === 'loading') {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3' />
          <p className='text-sm text-gray-600 dark:text-gray-400'>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (handled by useEffect, but show nothing while redirecting)
  if (status === 'unauthenticated') {
    return null;
  }

  const updateFormData = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0: // Claim Profile - optional, skip validation
        break;
      case 1: // Basic Info
        if (!formData.artistName.trim()) {
          newErrors.artistName = 'Artist name is required';
        }
        if (!formData.genreId) {
          newErrors.genreId = 'Please select a genre';
        }
        break;
      case 2: // Details - all optional
        break;
      case 3: // Review - no validation needed
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < TOTAL_STEPS - 1) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      // If user claimed a profile, update it instead of creating new
      if (formData.claimedProfileId) {
        const response = await fetch('/api/artist-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artistName: formData.artistName,
            genreId: formData.genreId,
            bio: formData.bio || undefined,
            country: formData.country || undefined,
            province: formData.province || undefined,
            city: formData.city || undefined,
            website: formData.website || undefined,
            profileImage: formData.profileImage || undefined,
            coverImage: formData.coverImage || undefined,
            skillIds: formData.skillIds,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update profile');
        }

        router.push('/dashboard');
        return;
      }

      // Otherwise, create new profile
      const response = await fetch('/api/artist-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: formData.artistName,
          genreId: formData.genreId,
          bio: formData.bio || undefined,
          country: formData.country || undefined,
          province: formData.province || undefined,
          city: formData.city || undefined,
          website: formData.website || undefined,
          profileImage: formData.profileImage || undefined,
          coverImage: formData.coverImage || undefined,
          skillIds: formData.skillIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create profile');
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      setErrors({
        submit:
          error instanceof Error ? error.message : 'Failed to save profile',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepNames = ['Claim Profile', 'Basic Info', 'Details', 'Review'];

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-slate-950'>
      {/* Header */}
      <div className='bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800'>
        <div className='max-w-4xl mx-auto px-6 py-5'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Link href='/' className='flex-shrink-0'>
                <Image
                  src='/main_logo.png'
                  alt='Flemoji'
                  width={140}
                  height={42}
                  priority
                  className='h-8 w-auto'
                />
              </Link>
              <div>
                <h1 className='text-xl font-semibold text-gray-900 dark:text-white mb-0.5'>
                  Create Your Artist Profile
                </h1>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Step {currentStep + 1} of {TOTAL_STEPS}:{' '}
                  {stepNames[currentStep]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className='bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800'>
        <div className='max-w-4xl mx-auto px-6 py-4'>
          <div className='flex items-center gap-3'>
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
              <React.Fragment key={index}>
                <div className='flex items-center gap-3'>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      index < currentStep
                        ? 'bg-blue-600 text-white'
                        : index === currentStep
                          ? 'bg-blue-600 text-white ring-2 ring-blue-100 dark:ring-blue-900/30'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {index < currentStep ? (
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 13l4 4L19 7'
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < TOTAL_STEPS - 1 && (
                    <div
                      className={`h-0.5 w-16 transition-colors ${
                        index < currentStep
                          ? 'bg-blue-600'
                          : 'bg-gray-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-2xl mx-auto px-6 py-10'>
        <div>
          {currentStep === 0 && (
            <ClaimProfileStep
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              onClaimed={() => {
                // Auto-advance to next step when profile is claimed
                if (currentStep < TOTAL_STEPS - 1) {
                  setCurrentStep(1);
                }
              }}
            />
          )}
          {currentStep === 1 && (
            <BasicInfoStep
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
            />
          )}
          {currentStep === 2 && (
            <DetailsStep
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
            />
          )}
          {currentStep === 3 && (
            <ReviewStep
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Navigation */}
        <div className='mt-10 pt-6 border-t border-gray-200 dark:border-slate-800'>
          {currentStep === 0 ? (
            <div className='flex flex-col items-center gap-4'>
              <div className='flex items-center gap-4 w-full'>
                <div className='flex-1 h-px bg-gray-200 dark:bg-slate-700' />
                <span className='text-sm text-gray-500 dark:text-gray-400'>
                  or
                </span>
                <div className='flex-1 h-px bg-gray-200 dark:bg-slate-700' />
              </div>
              <Button
                className='bg-blue-600 text-white hover:bg-blue-700 px-6'
                endContent={<ArrowRightIcon className='w-4 h-4' />}
                onPress={handleNext}
              >
                Create New Profile
              </Button>
            </div>
          ) : (
            <div className='flex items-center justify-between'>
              <Button
                variant='light'
                className='text-gray-700 dark:text-gray-300'
                startContent={<ArrowLeftIcon className='w-4 h-4' />}
                onPress={handleBack}
              >
                Back
              </Button>

              {currentStep < TOTAL_STEPS - 1 ? (
                <Button
                  className='bg-blue-600 text-white hover:bg-blue-700 px-6'
                  endContent={<ArrowRightIcon className='w-4 h-4' />}
                  onPress={handleNext}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  className='bg-blue-600 text-white hover:bg-blue-700 px-6'
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                >
                  Complete Profile
                </Button>
              )}
            </div>
          )}
        </div>

        {errors.submit && (
          <div className='mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
            <p className='text-sm text-red-700 dark:text-red-400'>
              {errors.submit}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
