import { Link } from 'react-router';
import { Clock, Star, Bookmark } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Course } from '../data/mockData';
import { isCourseSaved, subscribeToSkillFinderUpdates, toggleSavedCourse } from '../lib/courseStore';

interface CourseCardProps {
  course: Course;
}

const levelColors = {
  Principiante: 'bg-green-100 text-green-700',
  Intermedio: 'bg-yellow-100 text-yellow-700',
  Avanzado: 'bg-red-100 text-red-700',
};

export function CourseCard({ course }: CourseCardProps) {
  const [saved, setSaved] = useState(() => isCourseSaved(course.id));

  useEffect(() => subscribeToSkillFinderUpdates(() => setSaved(isCourseSaved(course.id))), [course.id]);

  return (
    <article className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        <img
          src={course.image}
          alt={course.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <button
          type="button"
          aria-label={saved ? 'Quitar de guardados' : 'Guardar curso'}
          onClick={() => setSaved(toggleSavedCourse(course.id))}
          className="absolute top-3 left-3 bg-white/90 backdrop-blur text-gray-700 p-2 rounded-full hover:bg-white"
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-purple-600 text-purple-600' : ''}`} />
        </button>

        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-medium text-white ${course.isPaid ? 'bg-purple-600' : 'bg-green-600'}`}>
          {course.isPaid ? `$${course.price}` : 'Gratis'}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${levelColors[course.level]}`}>
            {course.level}
          </span>
          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700">
            {course.category}
          </span>
          {course.tags?.slice(0, 1).map((tag) => (
            <span key={tag} className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
              #{tag}
            </span>
          ))}
        </div>

        <Link to={`/course/${course.id}`} className="block">
          <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
            {course.title}
          </h3>
        </Link>

        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{course.shortDescription}</p>
        <p className="text-xs text-gray-500 mb-4">Por {course.creator.name}</p>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-gray-900">{course.rating}</span>
            <span>({course.reviews})</span>
          </div>
        </div>

        <Link
          to={`/course/${course.id}`}
          className="block w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors font-medium text-center"
        >
          Ver curso
        </Link>
      </div>
    </article>
  );
}
