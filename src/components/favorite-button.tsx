import { Heart } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  artworkId,
  className,
  size = "md",
}: {
  artworkId: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const nav = useNavigate();
  const { isFavorite, toggle, isAuthenticated } = useFavorites();
  const active = isFavorite(artworkId);
  const sizePx = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const iconPx = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      nav({ to: "/login" });
      return;
    }
    toggle(artworkId);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "Remover dos favoritos" : "Salvar nos favoritos"}
      aria-pressed={active}
      className={cn(
        "grid place-items-center rounded-full border border-border/60 bg-background/80 backdrop-blur transition-colors hover:bg-background",
        active && "border-primary/60 text-primary",
        sizePx,
        className,
      )}
    >
      <Heart className={cn(iconPx, active && "fill-primary")} />
    </button>
  );
}
