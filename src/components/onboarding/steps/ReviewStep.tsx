'use client';

import React, { useState, useEffect } from 'react';
import { WizardFormData } from '../ArtistProfileWizard';
import ImageUpload from '@/components/ui/ImageUpload';
import { uploadImageToR2 } from '@/lib/image-upload';

interface Skill {
  id: string;
  name: string;
}

interface ReviewStepProps {
  formData: WizardFormData;
  updateFormData: (_updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

export default function ReviewStep({
  formData,
  updateFormData,
  errors: _errors,
  isSubmitting: _isSubmitting,
}: ReviewStepProps) {
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch('/api/skills');
        if (response.ok) {
          const data = await response.json();
          setSkills(data.skills || []);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
      }
    };

    if (formData.skillIds.length > 0) {
      fetchSkills();
    }
  }, [formData.skillIds.length]);

  const getSkillName = (skillId: string) => {
    const skill = skills.find(s => s.id === skillId);
    return skill?.name || skillId;
  };

  const handleProfileImageChange = async (file: File | null) => {
    if (!file) return;
    setIsUploadingProfile(true);
    try {
      const url = await uploadImageToR2(file);
      updateFormData({ profileImage: url });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload profile image');
    } finally {
      setIsUploadingProfile(false);
    }
  };

  const handleCoverImageChange = async (file: File | null) => {
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const url = await uploadImageToR2(file);
      updateFormData({ coverImage: url });
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert('Failed to upload cover image');
    } finally {
      setIsUploadingCover(false);
    }
  };

  return (
    <div className='space-y-12'>
      <div className='space-y-2'>
        <h3 className='text-2xl font-semibold text-gray-900 dark:text-white'>
          Review & Complete
        </h3>
        <p className='text-sm text-gray-400 dark:text-gray-500 italic leading-relaxed'>
          Take a final look at your profile information. You can add images now
          or update everything later from your dashboard.
        </p>
      </div>

      {/* Profile Summary */}
      <div className='border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-8 space-y-6'>
        <div className='border-b border-gray-200 dark:border-slate-700 pb-5'>
          <h4 className='text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3'>
            Artist Name
          </h4>
          <p className='text-xl font-semibold text-gray-900 dark:text-white'>
            {formData.artistName || 'Not set'}
          </p>
        </div>

        {formData.bio && (
          <div className='border-b border-gray-200 dark:border-slate-700 pb-5'>
            <h4 className='text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3'>
              Bio
            </h4>
            <p className='text-gray-700 dark:text-gray-300 leading-relaxed'>
              {formData.bio}
            </p>
          </div>
        )}

        {(formData.country || formData.province || formData.city) && (
          <div className='border-b border-gray-200 dark:border-slate-700 pb-5'>
            <h4 className='text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3'>
              Location
            </h4>
            <p className='text-gray-700 dark:text-gray-300'>
              {[formData.city, formData.province, formData.country]
                .filter(Boolean)
                .join(', ') || 'Not set'}
            </p>
          </div>
        )}

        {formData.website && (
          <div className='border-b border-gray-200 dark:border-slate-700 pb-5'>
            <h4 className='text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3'>
              Website
            </h4>
            <a
              href={formData.website}
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-600 dark:text-blue-400 hover:underline'
            >
              {formData.website}
            </a>
          </div>
        )}

        {formData.skillIds.length > 0 && (
          <div>
            <h4 className='text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3'>
              Skills
            </h4>
            <div className='flex flex-wrap gap-2'>
              {formData.skillIds.map(skillId => (
                <span
                  key={skillId}
                  className='px-3 py-1.5 bg-blue-600 text-white text-sm font-medium'
                >
                  {getSkillName(skillId)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Uploads */}
      <div className='space-y-4'>
        <div className='space-y-2'>
          <h4 className='text-lg font-semibold text-gray-900 dark:text-white'>
            Profile Images
          </h4>
          <p className='text-xs text-gray-400 dark:text-gray-500 italic'>
            Add a profile picture and cover image to make your profile stand
            out. These are optional and can be added later.
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='space-y-2'>
            <div className='block text-sm font-medium text-gray-900 dark:text-white'>
              Profile Image
            </div>
            <ImageUpload
              preview={formData.profileImage}
              onImageChange={handleProfileImageChange}
              disabled={isUploadingProfile}
              aspectRatio={1}
              maxFileSize={5}
            />
          </div>

          <div className='space-y-2'>
            <div className='block text-sm font-medium text-gray-900 dark:text-white'>
              Cover Image
            </div>
            <ImageUpload
              preview={formData.coverImage}
              onImageChange={handleCoverImageChange}
              disabled={isUploadingCover}
              aspectRatio={16 / 9}
              maxFileSize={10}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
