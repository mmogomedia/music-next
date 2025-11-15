'use client';

import React from 'react';
import { Progress } from '@heroui/react';
import {
  validatePassword,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  type PasswordValidationResult,
} from '@/lib/validations/password';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

export default function PasswordStrength({
  password,
  showRequirements = true,
  className = '',
}: PasswordStrengthProps) {
  if (!password) {
    return null;
  }

  const validation: PasswordValidationResult = validatePassword(password);
  const color = getPasswordStrengthColor(validation.strength);
  const label = getPasswordStrengthLabel(validation.strength);

  return (
    <div className={className}>
      <div className='mb-2'>
        <div className='flex items-center justify-between mb-1'>
          <span className='text-sm font-medium text-foreground'>
            Password Strength
          </span>
          <span
            className={`text-sm font-semibold ${
              color === 'danger'
                ? 'text-danger'
                : color === 'warning'
                  ? 'text-warning'
                  : 'text-success'
            }`}
          >
            {label}
          </span>
        </div>
        <Progress
          value={validation.score}
          color={
            color === 'danger'
              ? 'danger'
              : color === 'warning'
                ? 'warning'
                : 'success'
          }
          className='w-full'
          size='sm'
        />
      </div>

      {showRequirements && validation.errors.length > 0 && (
        <div className='mt-2 space-y-1'>
          <p className='text-xs font-medium text-foreground mb-1'>
            Requirements:
          </p>
          <ul className='space-y-1'>
            {validation.errors.map((error, index) => (
              <li
                key={index}
                className='text-xs text-danger flex items-center gap-1'
              >
                <span className='text-danger'>•</span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showRequirements && validation.isValid && (
        <div className='mt-2'>
          <p className='text-xs text-success flex items-center gap-1'>
            <span>✓</span>
            Password meets all requirements
          </p>
        </div>
      )}
    </div>
  );
}
