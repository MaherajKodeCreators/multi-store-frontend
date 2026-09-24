import { imageUrl } from "@/lib/types";

export function ProductThumb({ images, name, className }: { images: string[]; name: string; className?: string }) {
  if (images[0]) {
    // eslint-disable-next-line @next/next/no-img-element -- product photos are uploaded/external, not build-time assets
    return <img src={imageUrl(images[0])} alt={name} className={className} loading="lazy" />;
  }
  return (
    <div className={`flex items-center justify-center bg-secondary ${className ?? ""}`}>
      <span className="font-serif text-4xl text-foreground/15 italic">{name.charAt(0)}</span>
    </div>
  );
}
