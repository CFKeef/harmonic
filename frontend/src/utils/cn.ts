import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// https://github.com/shadcn-ui/ui/blob/f1e51ec8a18e879d1dd4a0538c7958c5a05a3cf3/apps/v4/lib/utils.ts#L4
// useful for managing conditional logic around classnames
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}