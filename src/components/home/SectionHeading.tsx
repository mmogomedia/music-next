import Link from 'next/link';

interface SectionHeadingProps {
  /** Two-digit section marker, e.g. "01". */
  number: string;
  eyebrow: string;
  title: string;
  blurb: string;
  action: { label: string; href: string };
  /** Gradient sections invert the type and button treatment. */
  tone?: 'light' | 'onGradient';
  /** Light-tone action button style — outlined by default. */
  actionVariant?: 'outline' | 'solid';
}

export default function SectionHeading({
  number,
  eyebrow,
  title,
  blurb,
  action,
  tone = 'light',
  actionVariant = 'outline',
}: SectionHeadingProps) {
  const onGradient = tone === 'onGradient';

  return (
    <div className='flex flex-wrap items-end justify-between gap-7'>
      <div>
        <div className='mb-3.5 flex items-center gap-2.5'>
          <span
            className={`font-jakarta text-[13px] font-extrabold tracking-[.1em] ${
              onGradient
                ? 'text-white/90'
                : 'text-[#7C3AED] dark:text-purple-400'
            }`}
          >
            {number}
          </span>
          <span
            aria-hidden
            className={`block h-0.5 w-[26px] ${onGradient ? 'bg-white/40' : 'bg-[#E4DDFB] dark:bg-purple-900/50'}`}
          />
          <span
            className={`text-[13px] font-bold uppercase tracking-[.1em] ${
              onGradient
                ? 'text-white/90'
                : 'text-[#7C3AED] dark:text-purple-400'
            }`}
          >
            {eyebrow}
          </span>
        </div>

        <h2
          className={`max-w-3xl font-jakarta text-[clamp(1.875rem,3.6vw,3.125rem)] font-extrabold leading-[1.06] tracking-[-.032em] text-balance ${
            onGradient ? 'text-white' : 'text-[#0F1222] dark:text-white'
          }`}
        >
          {title}
        </h2>
        <p
          className={`mt-4 max-w-xl text-[17px] leading-relaxed text-pretty ${
            onGradient ? 'text-white/80' : 'text-[#5B5F73] dark:text-gray-400'
          }`}
        >
          {blurb}
        </p>
      </div>

      <Link
        href={action.href}
        className={`flex-none rounded-[10px] px-6 py-3.5 text-[15px] font-bold transition-colors ${
          onGradient
            ? 'bg-white text-[#5B3BF0] shadow-[0_10px_26px_rgba(15,18,34,.18)] hover:bg-[#F3EEFF]'
            : actionVariant === 'solid'
              ? 'bg-[#5B3BF0] text-white shadow-[0_8px_22px_rgba(91,59,240,.28)] hover:bg-[#4A2CE0]'
              : 'border border-[#E4E3EE] bg-white text-[#0F1222] hover:border-[#7C3AED] hover:text-[#7C3AED] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-purple-500 dark:hover:text-purple-400'
        }`}
      >
        {action.label}
      </Link>
    </div>
  );
}
