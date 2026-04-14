import { Book } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/api';

interface BookCoverProps {
  coverImage?: string | null;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'h-10 w-8',
  sm: 'h-14 w-10',
  md: 'h-20 w-14',
  lg: 'h-32 w-24',
};

export default function BookCover({ coverImage, title, size = 'sm', className = '' }: BookCoverProps) {
  const coverUrl = resolveMediaUrl(coverImage);

  if (coverUrl) {
    return (
      <div className={`relative ${sizeClasses[size]} shrink-0 overflow-hidden rounded-lg bg-slate-100 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={title ? `${title} cover` : 'Book cover'}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`flex ${sizeClasses[size]} shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-200 ${className}`}>
      <Book className="h-4 w-4 text-slate-400" />
    </div>
  );
}
