import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function PremiumBadge({ size = 'md', showText = true }: PremiumBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <span className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full font-medium ${sizeClasses[size]}`}>
      <Crown size={iconSizes[size]} className="fill-current" />
      {showText && 'Premium'}
    </span>
  );
}
