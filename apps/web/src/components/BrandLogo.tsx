import Link from "next/link";
import Image from "next/image";
import { brand } from "@/lib/brand";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  priority?: boolean;
  variant?: "horizontal" | "sidebar" | "mark";
};

export function BrandLogo({ compact = false, className = "", priority = false, variant = "horizontal" }: BrandLogoProps) {
  if (compact || variant === "mark") {
    return (
      <Link href="/" className={`inline-flex items-center ${className}`} aria-label="Finexeble FXpay">
        <Image
          src={brand.logoIcon}
          alt="Finexeble FXpay"
          width={44}
          height={44}
          priority={priority}
          className="h-10 w-10 object-contain"
        />
      </Link>
    );
  }

  const heightClass = variant === "sidebar" ? "h-10" : "h-11";

  return (
    <Link href="/" className={`inline-flex items-center ${className}`} aria-label="Finexeble FXpay">
      <Image
        src={brand.logo}
        alt="Finexeble FXpay"
        width={492}
        height={133}
        priority={priority}
        className={`${heightClass} w-auto object-contain`}
      />
    </Link>
  );
}
