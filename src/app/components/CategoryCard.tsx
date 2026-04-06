import { Link } from 'react-router';
import { Home, Laptop, ChefHat, BookOpen, Briefcase } from 'lucide-react';

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export function CategoryCard({ name, icon, color }: CategoryCardProps) {
  const iconMap = {
    home: Home,
    laptop: Laptop,
    chefHat: ChefHat,
    bookOpen: BookOpen,
    briefcase: Briefcase,
  };

  const Icon = iconMap[icon as keyof typeof iconMap] || Home;

  return (
    <Link
      to={`/search?category=${encodeURIComponent(name)}`}
      className="group"
    >
      <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer">
        <div className={`w-16 h-16 rounded-full ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className="w-8 h-8" />
        </div>
        <span className="font-medium text-gray-900">{name}</span>
      </div>
    </Link>
  );
}
