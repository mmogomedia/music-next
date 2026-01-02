import React from 'react';

interface AIIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * Stars-inspired AI Icon for Flemoji
 * Features three stars: one large star on the right, smaller star top left, slightly smaller star bottom left
 */
export default function AIIcon({
  className = '',
  size = 24,
  ...props
}: AIIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      {...props}
    >
      {/* Large star on the right - significantly bigger proportionally */}
      <path
        d='M17 4L19.36 11.45L24 13L19.36 14.55L17 22L14.64 14.55L10 13L14.64 11.45L17 4Z'
        fill='currentColor'
      />

      {/* Smaller star top left */}
      <path
        d='M4 4L4.73 6.18L7 7L4.73 7.82L4 10L3.27 7.82L1 7L3.27 6.18L4 4Z'
        fill='currentColor'
        opacity='0.8'
      />

      {/* Slightly smaller star bottom left */}
      <path
        d='M5 17L5.64 18.82L7.5 19.5L5.64 20.18L5 22L4.36 20.18L2.5 19.5L4.36 18.82L5 17Z'
        fill='currentColor'
        opacity='0.7'
      />
    </svg>
  );
}

/**
 * Compact version for smaller spaces
 */
export function AIIconCompact({
  className = '',
  size = 20,
  ...props
}: AIIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      {...props}
    >
      {/* Large star on the right - significantly bigger proportionally */}
      <path
        d='M17 4L19.36 11.45L24 13L19.36 14.55L17 22L14.64 14.55L10 13L14.64 11.45L17 4Z'
        fill='currentColor'
      />

      {/* Smaller star top left */}
      <path
        d='M4 4L4.73 6.18L7 7L4.73 7.82L4 10L3.27 7.82L1 7L3.27 6.18L4 4Z'
        fill='currentColor'
        opacity='0.8'
      />

      {/* Slightly smaller star bottom left */}
      <path
        d='M5 17L5.64 18.82L7.5 19.5L5.64 20.18L5 22L4.36 20.18L2.5 19.5L4.36 18.82L5 17Z'
        fill='currentColor'
        opacity='0.7'
      />
    </svg>
  );
}
