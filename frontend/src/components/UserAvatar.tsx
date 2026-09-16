import { BrandMark } from '@/components/BrandLogo';

export function userInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function UserAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = userInitials(name);

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--primary-light)] text-sm font-semibold text-[var(--primary)]"
      style={{ width: size, height: size }}
    >
      {initials || <BrandMark size={size} />}
    </div>
  );
}
