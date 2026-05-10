import Image from 'next/image';

interface LogoTextProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function LogoText({ size = 'md', className = '' }: LogoTextProps) {
  const sizeMap = {
    sm: { width: 120, height: 40 },
    md: { width: 180, height: 60 },
    lg: { width: 240, height: 80 },
    xl: { width: 320, height: 100 },
  };

  const dimensions = sizeMap[size];

  return (
    <Image
      src="/assets/logos/HOMTEXT.png"
      alt="Hall of Mirrors"
      width={dimensions.width}
      height={dimensions.height}
      className={`object-contain ${className}`}
      priority
    />
  );
}
