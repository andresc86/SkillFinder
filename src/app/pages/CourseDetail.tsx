import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  Star,
  Play,
  CheckCircle2,
  User,
  Bookmark,
  Layers3,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { Navbar } from '../components/Navbar';
import { db } from '../../services/firebaseConfig';
import {
  getLessonsDuration,
  hasStartedCourse,
  isCourseSaved,
  startCourse,
  subscribeToSkillFinderUpdates,
  toggleSavedCourse,
} from '../lib/courseStore';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed?: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  duration: string;
  isPaid: boolean;
  price?: number;
  image: string;
  lessons: Lesson[];
  tags?: string[];
  creator?: {
    name: string;
  };
  rating?: number;
  reviews?: number;
  students?: number;
}

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [startedCourse, setStartedCourse] = useState(() => hasStartedCourse(id || ''));
  const [saved, setSaved] = useState(() => isCourseSaved(id || ''));

  useEffect(() => {
    const unsubscribe = subscribeToSkillFinderUpdates(() => {
      setStartedCourse(hasStartedCourse(id || ''));
      setSaved(isCourseSaved(id || ''));
    });

    return unsubscribe;
  }, [id]);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) {
        setCourse(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const docRef = doc(db, 'courses', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setCourse({
            id: docSnap.id,
            title: data.title || '',
            description: data.description || '',
            category: data.category || '',
            level: data.level || 'Principiante',
            duration: data.duration || '0 min',
            isPaid: data.isPaid || false,
            price: data.price || 0,
            image: data.image || '',
            lessons: Array.isArray(data.lessons) ? data.lessons : [],
            tags: Array.isArray(data.tags) ? data.tags : [],
            creator: data.creator || { name: 'Autor de SkillFinder' },
            rating: data.rating ?? 4.8,
            reviews: data.reviews ?? 12,
            students: data.students ?? 35,
          });
        } else {
          setCourse(null);
        }
      } catch (error) {
        console.error('Error al cargar el curso:', error);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const totalLessonsDuration = useMemo(
    () => getLessonsDuration(course?.lessons || []),
    [course]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cargando curso...</h1>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Curso no encontrado</h1>
          <Link to="/search" className="text-purple-600 hover:text-purple-700">
            Volver a la búsqueda
          </Link>
        </div>
      </div>
    );
  }

  const levelColors = {
    Principiante: 'bg-green-100 text-green-700',
    Intermedio: 'bg-yellow-100 text-yellow-700',
    Avanzado: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showSearch />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/search"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver a resultados</span>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-900 mb-6">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <button
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  type="button"
                >
                  <Play className="w-10 h-10 text-purple-600 ml-1" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 mb-6 border border-gray-200">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${levelColors[course.level]}`}
                >
                  {course.level}
                </span>
                <span className="px-3 py-1 rounded-lg text-sm font-medium bg-purple-100 text-purple-700">
                  {course.category}
                </span>
                {course.isPaid ? (
                  <span className="px-3 py-1 rounded-lg text-sm font-medium bg-purple-600 text-white">
                    ${course.price}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-lg text-sm font-medium bg-green-600 text-white">
                    Gratis
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span>{course.creator?.name || 'Autor de SkillFinder'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers3 className="w-5 h-5" />
                  <span>{course.lessons.length} lecciones</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-gray-900">{course.rating ?? 4.8}</span>
                  <span>({course.reviews ?? 12} reseñas)</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Sobre este curso
                </h2>
                <p className="text-gray-700 leading-relaxed">{course.description}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 mb-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Contenido del curso
              </h2>
              <div className="space-y-3">
                {course.lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {lesson.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                      ) : (
                        <span className="text-purple-600 font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                      <p className="text-sm text-gray-500">{lesson.duration}</p>
                    </div>
                    <Play className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Valoraciones y comentarios
              </h2>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900 mb-1">
                    {course.rating ?? 4.8}
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(course.rating ?? 4.8)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    {course.reviews ?? 12} reseñas
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-start gap-4">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=User1"
                      alt="Usuario"
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Patricia Rodríguez</h4>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">
                        Excelente curso, muy práctico y fácil de seguir. Las
                        explicaciones son claras y los ejemplos muy útiles.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Hace 2 días</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-start gap-4">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=User2"
                      alt="Usuario"
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Roberto Jiménez</h4>
                        <div className="flex items-center gap-1">
                          {[...Array(4)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                          <Star className="w-4 h-4 text-gray-300" />
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm">
                        Muy bueno, aprendí mucho. Lo recomiendo para principiantes.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Hace 1 semana</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-24">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {course.isPaid ? `$${course.price}` : 'Gratis'}
                </h3>
                <p className="text-sm text-gray-600">
                  Curso listo para empezar con {course.lessons.length} lecciones y una
                  duración aproximada de {Math.round(totalLessonsDuration)} minutos.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    startCourse(course.id);
                    setStartedCourse(true);
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  {startedCourse ? 'Seguir aprendiendo' : 'Empezar curso'}
                </button>

                <button
                  type="button"
                  onClick={() => setSaved(toggleSavedCourse(course.id))}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 inline-flex items-center justify-center gap-2"
                >
                  <Bookmark
                    className={`w-5 h-5 ${
                      saved ? 'fill-purple-600 text-purple-600' : ''
                    }`}
                  />
                  {saved ? 'Guardado en tu perfil' : 'Guardar para después'}
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Nivel</span>
                  <span className="font-medium text-gray-900">{course.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lecciones</span>
                  <span className="font-medium text-gray-900">
                    {course.lessons.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Duración total</span>
                  <span className="font-medium text-gray-900">{course.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Popularidad</span>
                  <span className="inline-flex items-center gap-1 font-medium text-gray-900">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    {course.students ?? (course.reviews ?? 12) * 3}+ alumnos
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}