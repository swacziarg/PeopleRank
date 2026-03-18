import { getInitials, resolveAvatarLabel } from "@/lib/utils";

type AvatarProps = {
  imageUrl?: string | null;
  label?: string | null;
  alt: string;
  sizeClassName?: string;
  textClassName?: string;
  className?: string;
};

export function Avatar({
  imageUrl,
  label,
  alt,
  sizeClassName = "h-10 w-10",
  textClassName = "text-sm",
  className = ""
}: AvatarProps) {
  const normalizedImageUrl = imageUrl?.trim();
  const initials = getInitials(resolveAvatarLabel(label));
  const sharedClassName = `${sizeClassName} rounded-full border border-line ${className}`.trim();

  if (normalizedImageUrl) {
    return (
      <img
        src={normalizedImageUrl}
        alt={alt}
        className={`${sharedClassName} object-cover`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center bg-zinc-900 font-semibold text-accent ${textClassName} ${sharedClassName}`}
    >
      {initials}
    </div>
  );
}
