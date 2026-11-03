import { Category } from '@/utils/types';
import { categoryBadgeClass } from '@/utils/format';

interface Props {
  category: Category;
  corrected?: boolean;
}

export default function CategoryBadge({ category, corrected }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryBadgeClass(
        category,
      )}`}
    >
      {category}
      {corrected && (
        <span
          className="text-[10px] opacity-70"
          title="You corrected this category"
        >
          (edited)
        </span>
      )}
    </span>
  );
}
