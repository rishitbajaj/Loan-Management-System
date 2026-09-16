import Image from 'next/image';
import Link from 'next/link';

export function BrandLogo({ href = '/', height = 28, className = '', onClick }: { href?: string; height?: number; className?: string; onClick?: () => void }) {
  const width = Math.round(height * 4.2);
  return (
    <Link href={href} onClick={onClick} className={`inline-flex items-center ${className}`}>
      <Image src="/brand/logo.png" alt="CreditSea LMS" width={width} height={height} priority className="h-auto w-auto" style={{ height, width: 'auto', maxWidth: 140 }} />
    </Link>
  );
}

export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <Image
      src="/brand/favicon.png"
      alt=""
      width={size}
      height={size}
      className="rounded-full object-cover"
      aria-hidden
    />
  );
}
