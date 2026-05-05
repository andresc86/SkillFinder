import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
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
  Pencil,
  Trash2,
  MessageSquare,
} from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Navbar } from '../components/Navbar';
import { useAuthUser } from '../hooks/useAuthUser';
import {
  deleteFirebaseCourse,
  emitSkillFinderUpdate,
  getFirebaseCourseById,
  getLessonsDuration,
  hasStartedCourse,
  isCourseOwner,
  isCourseSaved,
  startCourse,
  subscribeToSkillFinderUpdates,
  toggleSavedCourse,
} from '../lib/courseStore';
import { db } from '../../services/firebaseConfig';
import type { Course } from '../data/mockData';

interface CourseReview {
  id: string;
  authorUid: string;
  authorName: string;
  authorAvatar: string;
  comment: string;
  rating: number;
  createdAt?: string;
}

function normalizeReviewDate(rawValue: unknown) {
  if (!rawValue) return '';
  if (typeof rawValue === 'string') return rawValue;
  if (typeof rawValue === 'object' && rawValue !== null && 'toDate' in rawValue) {
    const maybeTimestamp = rawValue as { toDate?: () => Date };
    return typeof maybeTimestamp.toDate === 'function'
      ? maybeTimestamp.toDate().toISOString()
      : '';
  }

  return '';
}

function formatReviewDate(value?: string) {
  if (!value) return 'Hace un momento';

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Hace un momento';

  const diffInHours = Math.max(1, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60)));
  if (diffInHours < 24) return `Hace ${diffInHours} h`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `Hace ${diffInDays} dia${diffInDays === 1 ? '' : 's'}`;

  return new Date(value).toLocaleDateString('es-CO');
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthUser();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [startedCourse, setStartedCourse] = useState(() => hasStartedCourse(id || ''));
  const [saved, setSaved] = useState(() => isCourseSaved(id || ''));
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [canManageCourse, setCanManageCourse] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewError, setReviewError] = useState('');
  const [savingReview, setSavingReview] = useState(false);

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
        const nextCourse = await getFirebaseCourseById(id);

        if (nextCourse) {
          setCourse(nextCourse);
          setActiveLessonIndex(0);
          setCanManageCourse(isCourseOwner(nextCourse.id, nextCourse.creator, user));
        } else {
          setCourse(null);
          setCanManageCourse(false);
        }
      } catch (error) {
        console.error('Error al cargar el curso:', error);
        setCourse(null);
        setCanManageCourse(false);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, user]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!id) {
        setReviews([]);
        setReviewsLoading(false);
        return;
      }

      try {
        setReviewsLoading(true);
        const snapshot = await getDocs(collection(db, 'courses', id, 'reviews'));
        const nextReviews = snapshot.docs
          .map((reviewDoc) => {
            const data = reviewDoc.data();
            return {
              id: reviewDoc.id,
              authorUid: String(data.authorUid ?? ''),
              authorName: String(data.authorName ?? 'Usuario SkillFinder'),
              authorAvatar: String(
                data.authorAvatar ??
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                    String(data.authorName ?? 'SkillFinder')
                  )}`
              ),
              comment: String(data.comment ?? ''),
              rating: typeof data.rating === 'number' ? data.rating : 0,
              createdAt: normalizeReviewDate(data.updatedAt ?? data.createdAt),
            } satisfies CourseReview;
          })
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        setReviews(nextReviews);

        const ownReview = user ? nextReviews.find((review) => review.authorUid === user.uid) : undefined;
        if (ownReview) {
          setReviewComment(ownReview.comment);
          setReviewRating(ownReview.rating || 5);
        } else {
          setReviewComment('');
          setReviewRating(5);
        }
      } catch (error) {
        console.error('Error al cargar reseñas:', error);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [id, user]);

  const totalLessonsDuration = useMemo(
    () => getLessonsDuration(course?.lessons || []),
    [course]
  );
  const activeLesson = course?.lessons[activeLessonIndex] ?? null;
  const averageRating = useMemo(() => {
    if (!reviews.length) return 0;
    return Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1));
  }, [reviews]);
  const reviewsCount = reviews.length;
  const canReviewCourse = Boolean(user && course && !canManageCourse);
  const ownReview = user ? reviews.find((review) => review.authorUid === user.uid) : undefined;

  const syncCourseReviewSummary = async (nextReviews: CourseReview[]) => {
    if (!id) return;

    const nextAverage = nextReviews.length
      ? Number((nextReviews.reduce((sum, review) => sum + review.rating, 0) / nextReviews.length).toFixed(1))
      : 0;

    await updateDoc(doc(db, 'courses', id), {
      rating: nextAverage,
      reviews: nextReviews.length,
      updatedAt: serverTimestamp(),
    });

    setCourse((prev) =>
      prev
        ? {
            ...prev,
            rating: nextAverage,
            reviews: nextReviews.length,
          }
        : prev
    );
    emitSkillFinderUpdate();
  };

  const handleDeleteCourse = async () => {
    if (!course || !canManageCourse || deleting) return;

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${course.title}"? Esta accion no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteFirebaseCourse(course.id);
      navigate('/profile');
    } catch (error) {
      console.error('Error al eliminar el curso:', error);
      setDeleting(false);
      window.alert('No se pudo eliminar el curso.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !user || !canReviewCourse) return;

    const trimmedComment = reviewComment.trim();
    if (trimmedComment.length < 8) {
      setReviewError('Escribe un comentario un poco mas completo.');
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Selecciona una calificacion valida.');
      return;
    }

    try {
      setSavingReview(true);
      setReviewError('');

      await setDoc(doc(db, 'courses', id, 'reviews', user.uid), {
        authorUid: user.uid,
        authorName: user.displayName || 'Usuario SkillFinder',
        authorAvatar:
          user.photoURL ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            user.displayName || user.email || 'SkillFinder'
          )}`,
        comment: trimmedComment,
        rating: reviewRating,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      const snapshot = await getDocs(collection(db, 'courses', id, 'reviews'));
      const nextReviews = snapshot.docs
        .map((reviewDoc) => {
          const data = reviewDoc.data();
          return {
            id: reviewDoc.id,
            authorUid: String(data.authorUid ?? ''),
            authorName: String(data.authorName ?? 'Usuario SkillFinder'),
            authorAvatar: String(
              data.authorAvatar ??
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                  String(data.authorName ?? 'SkillFinder')
                )}`
            ),
            comment: String(data.comment ?? ''),
            rating: typeof data.rating === 'number' ? data.rating : 0,
            createdAt: normalizeReviewDate(data.updatedAt ?? data.createdAt),
          } satisfies CourseReview;
        })
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      setReviews(nextReviews);
      await syncCourseReviewSummary(nextReviews);
    } catch (error) {
      console.error('Error al guardar reseña:', error);
      setReviewError('No se pudo guardar tu comentario.');
    } finally {
      setSavingReview(false);
    }
  };

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
            Volver a la busqueda
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
              {activeLesson?.videoUrl ? (
                <video
                  key={activeLesson.id}
                  src={activeLesson.videoUrl}
                  controls
                  className="w-full h-full object-cover bg-black"
                />
              ) : (
                <>
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <button
                      className="w-20 h-20 bg-white rounded-full flex items-center justify-center"
                      type="button"
                    >
                      <Play className="w-10 h-10 text-purple-600 ml-1" />
                    </button>
                  </div>
                </>
              )}
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

              {canManageCourse && (
                <div className="mb-6 flex flex-wrap gap-3">
                  <Link
                    to={`/course/${course.id}/edit`}
                    className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar curso y agregar lecciones
                  </Link>
                  <button
                    type="button"
                    onClick={handleDeleteCourse}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Eliminando...' : 'Eliminar curso'}
                  </button>
                </div>
              )}

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
                  <Star className={`w-5 h-5 ${averageRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  <span className="font-medium text-gray-900">
                    {averageRating ? averageRating : 'Sin reseñas'}
                  </span>
                  <span>({reviewsCount})</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Sobre este curso</h2>
                <p className="text-gray-700 leading-relaxed">{course.description}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 mb-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Contenido del curso</h2>
              <div className="space-y-3">
                {course.lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-colors cursor-pointer ${
                      index === activeLessonIndex
                        ? 'bg-purple-50 border border-purple-200'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                    onClick={() => setActiveLessonIndex(index)}
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
                      <p className="text-sm text-gray-500">
                        {lesson.duration}
                        {lesson.videoUrl ? ' - Video disponible' : ' - Sin video'}
                      </p>
                    </div>
                    <Play
                      className={`w-5 h-5 ${
                        lesson.videoUrl ? 'text-purple-600' : 'text-gray-400'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Valoraciones y comentarios</h2>
              </div>

              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900 mb-1">
                    {averageRating ? averageRating.toFixed(1) : '0.0'}
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    {reviewsCount} {reviewsCount === 1 ? 'reseña real' : 'reseñas reales'}
                  </div>
                </div>
              </div>

              {canReviewCourse && (
                <form onSubmit={handleSubmitReview} className="mb-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {ownReview ? 'Actualiza tu reseña' : 'Califica este curso'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Tu opinión se guardará en Firebase y reemplazará cualquier comentario fake.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReviewRating(value)}
                        className="p-1"
                        aria-label={`Calificar con ${value} estrellas`}
                      >
                        <Star
                          className={`w-7 h-7 ${
                            value <= reviewRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={reviewComment}
                    onChange={(e) => {
                      setReviewComment(e.target.value);
                      setReviewError('');
                    }}
                    rows={4}
                    placeholder="Comparte qué te gustó, qué aprendiste o qué mejorarías."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />

                  {reviewError && <p className="mt-3 text-sm text-red-600">{reviewError}</p>}

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingReview}
                      className="px-5 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-medium"
                    >
                      {savingReview
                        ? 'Guardando...'
                        : ownReview
                          ? 'Actualizar reseña'
                          : 'Publicar reseña'}
                    </button>
                  </div>
                </form>
              )}

              {canManageCourse && (
                <div className="mb-8 rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm text-purple-700">
                  Como creador del curso puedes editarlo o eliminarlo, pero no calificarlo a ti mismo.
                </div>
              )}

              {reviewsLoading ? (
                <p className="text-gray-500">Cargando comentarios reales...</p>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        <img
                          src={review.authorAvatar}
                          alt={review.authorName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{review.authorName}</h4>
                              <p className="text-xs text-gray-500">{formatReviewDate(review.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, index) => (
                                <Star
                                  key={index}
                                  className={`w-4 h-4 ${
                                    index < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aun no hay comentarios reales</h3>
                  <p className="text-gray-600">
                    {canReviewCourse
                      ? 'Sé la primera persona en dejar una reseña.'
                      : 'Todavía nadie ha calificado este curso.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-24">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {course.isPaid ? `$${course.price}` : 'Gratis'}
                </h3>
                <p className="text-sm text-gray-600">
                  Curso listo para empezar con {course.lessons.length} lecciones y una duracion aproximada de {Math.round(totalLessonsDuration)} minutos.
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {canManageCourse && (
                  <>
                    <Link
                      to={`/course/${course.id}/edit`}
                      className="w-full border border-purple-200 text-purple-700 py-3 rounded-xl font-medium hover:bg-purple-50 inline-flex items-center justify-center gap-2"
                    >
                      <Pencil className="w-5 h-5" />
                      Editar curso
                    </Link>
                    <button
                      type="button"
                      onClick={handleDeleteCourse}
                      disabled={deleting}
                      className="w-full border border-red-200 text-red-700 py-3 rounded-xl font-medium hover:bg-red-50 inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Trash2 className="w-5 h-5" />
                      {deleting ? 'Eliminando...' : 'Eliminar curso'}
                    </button>
                  </>
                )}

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
                  <Bookmark className={`w-5 h-5 ${saved ? 'fill-purple-600 text-purple-600' : ''}`} />
                  {saved ? 'Guardado en tu perfil' : 'Guardar para despues'}
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Nivel</span>
                  <span className="font-medium text-gray-900">{course.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lecciones</span>
                  <span className="font-medium text-gray-900">{course.lessons.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Duracion total</span>
                  <span className="font-medium text-gray-900">{course.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Valoracion real</span>
                  <span className="inline-flex items-center gap-1 font-medium text-gray-900">
                    <Star className={`w-4 h-4 ${averageRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    {averageRating ? averageRating.toFixed(1) : '0.0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Alumnos</span>
                  <span className="inline-flex items-center gap-1 font-medium text-gray-900">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    {course.students ?? 0}
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
