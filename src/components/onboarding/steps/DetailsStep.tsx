'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Textarea, Input, Select, SelectItem, Chip } from '@heroui/react';
import { WizardFormData } from '../ArtistProfileWizard';
import { Country, State, City } from 'country-state-city';

interface Skill {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface DetailsStepProps {
  formData: WizardFormData;
  updateFormData: (_updates: Partial<WizardFormData>) => void;
  errors: Record<string, string>;
}

export default function DetailsStep({
  formData,
  updateFormData,
  errors: _errors,
}: DetailsStepProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [provinces, setProvinces] = useState<
    ReturnType<typeof State.getStatesOfCountry>
  >([]);
  const [cities, setCities] = useState<
    ReturnType<typeof City.getCitiesOfState>
  >([]);
  const prevCountryRef = useRef<string>('');
  const prevProvinceRef = useRef<string>('');

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
      } finally {
        setIsLoadingSkills(false);
      }
    };

    fetchSkills();
  }, []);

  // Update provinces when country changes
  useEffect(() => {
    // Only update if country actually changed
    if (formData.country !== prevCountryRef.current) {
      prevCountryRef.current = formData.country;

      if (formData.country) {
        const countryStates = State.getStatesOfCountry(formData.country);
        setProvinces(countryStates);
        setCities([]); // Reset cities when country changes
        // Only reset province/city if they have values
        if (formData.province || formData.city) {
          updateFormData({ province: '', city: '' });
        }
      } else {
        setProvinces([]);
        setCities([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.country]);

  // Update cities when province changes
  useEffect(() => {
    // Only update if province actually changed
    if (formData.province !== prevProvinceRef.current) {
      prevProvinceRef.current = formData.province;

      if (formData.country && formData.province) {
        const provinceCities = City.getCitiesOfState(
          formData.country,
          formData.province
        );
        setCities(provinceCities);
        // Only reset city if it has a value
        if (formData.city) {
          updateFormData({ city: '' });
        }
      } else {
        setCities([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.province]);

  const toggleSkill = (skillId: string) => {
    const currentSkillIds = formData.skillIds || [];
    const newSkillIds = currentSkillIds.includes(skillId)
      ? currentSkillIds.filter(id => id !== skillId)
      : [...currentSkillIds, skillId];
    updateFormData({ skillIds: newSkillIds });
  };

  // Get all countries
  const countries = Country.getAllCountries();

  return (
    <div className='space-y-12'>
      <div className='space-y-2'>
        <h3 className='text-2xl font-semibold text-gray-900 dark:text-white'>
          Additional Details
        </h3>
        <p className='text-sm text-gray-400 dark:text-gray-500 italic leading-relaxed'>
          Help fans get to know you better. Share your story, location, and
          skills. All fields are optional—you can always add more later.
        </p>
      </div>

      <div className='space-y-10'>
        <div className='space-y-2'>
          <Textarea
            label='Bio'
            placeholder='Tell your story... What inspires your music? What makes you unique?'
            value={formData.bio}
            onValueChange={value => updateFormData({ bio: value })}
            minRows={5}
            classNames={{
              input: 'text-base',
              label: 'text-sm font-medium text-gray-900 dark:text-white',
              inputWrapper: 'border-gray-300 dark:border-slate-600',
            }}
          />
          <p className='text-xs text-gray-400 dark:text-gray-500 italic mt-1'>
            A compelling bio helps fans connect with you. Share your journey,
            influences, or what drives your music.
          </p>
        </div>

        <div className='space-y-3'>
          <div className='block text-sm font-medium text-gray-900 dark:text-white'>
            Location
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Select
              label='Country'
              placeholder='Select country'
              selectedKeys={formData.country ? [formData.country] : []}
              onSelectionChange={keys => {
                const selected = Array.from(keys)[0] as string;
                updateFormData({ country: selected || '' });
              }}
              classNames={{
                trigger: 'text-base',
                label: 'text-sm font-medium text-gray-900 dark:text-white',
              }}
            >
              {countries.map(country => (
                <SelectItem key={country.isoCode}>{country.name}</SelectItem>
              ))}
            </Select>

            <Select
              label='Province/State'
              placeholder='Select province'
              selectedKeys={formData.province ? [formData.province] : []}
              onSelectionChange={keys => {
                const selected = Array.from(keys)[0] as string;
                updateFormData({ province: selected || '' });
              }}
              isDisabled={!formData.country || provinces.length === 0}
              classNames={{
                trigger: 'text-base',
                label: 'text-sm font-medium text-gray-900 dark:text-white',
              }}
            >
              {provinces.map(province => (
                <SelectItem key={province.isoCode}>{province.name}</SelectItem>
              ))}
            </Select>

            <Select
              label='City'
              placeholder='Select city'
              selectedKeys={formData.city ? [formData.city] : []}
              onSelectionChange={keys => {
                const selected = Array.from(keys)[0] as string;
                updateFormData({ city: selected || '' });
              }}
              isDisabled={!formData.province || cities.length === 0}
              classNames={{
                trigger: 'text-base',
                label: 'text-sm font-medium text-gray-900 dark:text-white',
              }}
            >
              {cities.map(city => (
                <SelectItem key={city.name}>{city.name}</SelectItem>
              ))}
            </Select>
          </div>
          <p className='text-xs text-gray-400 dark:text-gray-500 italic mt-1'>
            Let fans know where you&apos;re based. This helps with local
            recommendations and connections.
          </p>
        </div>

        <div className='space-y-2'>
          <Input
            label='Website'
            placeholder='https://yourwebsite.com'
            value={formData.website}
            onValueChange={value => updateFormData({ website: value })}
            type='url'
            classNames={{
              input: 'text-base',
              label: 'text-sm font-medium text-gray-900 dark:text-white',
              inputWrapper: 'border-gray-300 dark:border-slate-600',
            }}
          />
          <p className='text-xs text-gray-400 dark:text-gray-500 italic mt-1'>
            Link to your personal website, social media, or music platform.
          </p>
        </div>

        <div className='space-y-3'>
          <div className='block text-sm font-medium text-gray-900 dark:text-white'>
            Skills
          </div>
          {isLoadingSkills ? (
            <div className='text-sm text-gray-400 dark:text-gray-500 italic'>
              Loading skills...
            </div>
          ) : (
            <>
              <div className='flex flex-wrap gap-2'>
                {skills.map(skill => {
                  const isSelected = formData.skillIds.includes(skill.id);
                  return (
                    <Chip
                      key={skill.id}
                      className={`cursor-pointer transition-all px-4 py-2 ${
                        isSelected
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                      }`}
                      onClick={() => toggleSkill(skill.id)}
                    >
                      {skill.name}
                    </Chip>
                  );
                })}
              </div>
              <p className='text-xs text-gray-400 dark:text-gray-500 italic mt-1'>
                Select all the skills that describe your musical abilities. This
                helps other artists find you for collaborations.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
