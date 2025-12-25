import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateDAppSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function getDisplayRating(
  voteScoreFromDB: number | null | undefined,
  ratingAverage: number | null | undefined,
  fallbackRating: number | null | undefined
): number | null {
  if (voteScoreFromDB && Number(voteScoreFromDB) > 0) {
    const v = Number(voteScoreFromDB);
    return v > 5 ? v / 2 : v;
  }

  if (fallbackRating && Number(fallbackRating) > 0) {
    return Number(fallbackRating);
  }

  if (ratingAverage && Number(ratingAverage) > 0) {
    return Number(ratingAverage);
  }

  return null;
}

export function formatRating(rating: number | null): string {
  return rating !== null && rating > 0 ? rating.toFixed(1) : '-';
}