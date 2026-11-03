// Lucide icons are imported by name. This file maps our recommendation icon
// names to the actual component so recommendation cards can render dynamically.

import {
  PiggyBank,
  Scale,
  TrendingUp,
  Repeat,
  Scissors,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  PiggyBank,
  Scale,
  TrendingUp,
  Repeat,
  Scissors,
  AlertTriangle,
  Lightbulb,
  Sparkles,
};

export function getIcon(name: string): LucideIcon {
  return ICONS[name] ?? Lightbulb;
}

export default function DynIcon({ name, className }: { name: string; className?: string }) {
  const Icon = getIcon(name);
  return <Icon className={className} />;
}
