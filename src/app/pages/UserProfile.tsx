import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Edit, BookMarked, Clock, Trophy, BookOpen, Save, Upload, Pencil, Trash2 } from 'lucide-react';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { Navbar } from '../components/Navbar';
import { CourseCard } from '../components/CourseCard';
import { useAuthUser } from '../hooks/useAuthUser';
import { uploadToCloudinary } from '../lib/cloudinary';
import {
  deleteFirebaseCourse,
  getAllCourses,
  getFirebaseCourses,
  getProfile,
  getPublishedCourses,
  subscribeToSkillFinderUpdates,
  updateProfile,
} from '../lib/courseStore';
import { auth } from '../../services/firebaseConfig';
import type { Course } from '../data/mockData';

const MAX_AVATAR_SIZE_MB = 3;

export default function UserProfile() {
  const { user, loading: authLoading } = useAuthUser();
  const [version, setVersion] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [firebaseCourses, setFirebaseCourses] = useState<Course[]>([]);
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const profile = useMemo(() => getProfile(), [user, version]);
  const allCourses = useMemo(() => {
    const remoteIds = new Set(firebaseCourses.map((course) => course.id));
    return [...firebaseCourses, ...getAllCourses().filter((course) => !remoteIds.has(course.id))];
  }, [firebaseCourses, version]);
  const [draftProfile, setDraftProfile] = useState({
    name: profile.name,
    email: profile.email,
    headline: profile.headline,
    bio: profile.bio,
  });

  useEffect(() => subscribeToSkillFinderUpdates(() => setVersion((value) => value + 1)), []);

  useEffect(() => {
    if (authLoading) return;

    const loadCourses = async () => {
      try {
        const [courses, ownCourses] = await Promise.all([
          getFirebaseCourses(),
          getPublishedCourses(),
        ]);
        setFirebaseCourses(courses);
        setPublishedCourses(ownCourses);
      } catch (error) {
        console.error('No se pudieron cargar los cursos del perfil:', error);
        setFirebaseCourses([]);
        setPublishedCourses([]);
      }
    };

    loadCourses();
  }, [authLoading, user, version]);

  useEffect(() => {
    setDraftProfile({
      name: profile.name,
      email: profile.email,
      headline: profile.headline,
      bio: profile.bio,
    });
    setAvatarPreview(profile.avatar);
  }, [profile]);

  const savedCourses = allCourses.filter((course) => profile.savedCourses.includes(course.id));
  const completedCourses = allCourses.filter((course) => profile.completedCourses.includes(course.id));
  const inProgressCoursesData = profile.inProgressCourses
    .map((inProgress) => {
      const course = allCourses.find((c) => c.id === inProgress.courseId);
      return { course, progress: inProgress.progress };
    })
    .filter((item) => item.course);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Sube una imagen valida para el perfil.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_MB * 1024 * 1024) {
      alert(`La foto de perfil no puede superar ${MAX_AVATAR_SIZE_MB} MB.`);
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);

      let uploadedAvatar = profile.avatar;
      if (avatarFile) {
        uploadedAvatar = await uploadToCloudinary(avatarFile, 'image');
      }

      updateProfile({
        name: draftProfile.name.trim(),
        email: draftProfile.email.trim(),
        headline: draftProfile.headline.trim(),
        bio: draftProfile.bio.trim(),
        avatar: uploadedAvatar,
      });

      if (auth.currentUser) {
        await updateAuthProfile(auth.currentUser, {
          displayName: draftProfile.name.trim(),
          photoURL: uploadedAvatar,
        });
      }

      setAvatarFile(null);
      setIsEditing(false);
      setVersion((value) => value + 1);
    } catch (error) {
      console.error('No se pudo guardar el perfil:', error);
      alert('No se pudo actualizar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar "${course.title}"? Esta accion no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      setDeletingCourseId(course.id);
      await deleteFirebaseCourse(course.id);
      setPublishedCourses((prev) => prev.filter((item) => item.id !== course.id));
      setFirebaseCourses((prev) => prev.filter((item) => item.id !== course.id));
      setVersion((value) => value + 1);
    } catch (error) {
      console.error('Error al eliminar curso desde perfil:', error);
      alert('No se pudo eliminar el curso.');
    } finally {
      setDeletingCourseId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl p-6 md:p-8 mb-8 border border-gray-200">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative">
              <img
                src={avatarPreview || profile.avatar}
                alt={profile.name}
                className="w-24 h-24 rounded-full border-4 border-purple-100 object-cover"
              />
              {isEditing && (
                <label className="absolute -bottom-2 -right-2 bg-purple-600 text-white p-2 rounded-full cursor-pointer hover:bg-purple-700">
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex-1 w-full">
              {!isEditing ? (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                  <p className="text-gray-600 mb-1">{profile.email}</p>
                  <p className="text-sm font-medium text-purple-700 mb-3">{profile.headline}</p>
                  <p className="text-gray-600 max-w-3xl">{profile.bio}</p>
                </>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900 mb-2 block">Nombre</label>
                    <input
                      type="text"
                      value={draftProfile.name}
                      onChange={(e) => setDraftProfile((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 mb-2 block">Correo</label>
                    <input
                      type="email"
                      value={draftProfile.email}
                      onChange={(e) => setDraftProfile((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-900 mb-2 block">Titular</label>
                    <input
                      type="text"
                      value={draftProfile.headline}
                      onChange={(e) => setDraftProfile((prev) => ({ ...prev, headline: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-900 mb-2 block">Biografia</label>
                    <textarea
                      value={draftProfile.bio}
                      onChange={(e) => setDraftProfile((prev) => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <BookMarked className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{savedCourses.length}</p>
                    <p className="text-sm text-gray-600">Guardados</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{completedCourses.length}</p>
                    <p className="text-sm text-gray-600">Completados</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{inProgressCoursesData.length}</p>
                    <p className="text-sm text-gray-600">En progreso</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{publishedCourses.length}</p>
                    <p className="text-sm text-gray-600">Publicados</p>
                  </div>
                </div>
              </div>
            </div>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-5 h-5" />
                <span className="font-medium">Editar perfil</span>
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setAvatarFile(null);
                    setAvatarPreview(profile.avatar);
                  }}
                  className="px-5 py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-purple-400"
                >
                  <Save className="w-4 h-4" />
                  {savingProfile ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {publishedCourses.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-orange-600" />
              Cursos publicados por ti
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedCourses.map((course) => (
                <div key={course.id}>
                  <CourseCard course={course} />
                  <div className="mt-3 flex gap-3">
                    <Link
                      to={`/course/${course.id}/edit`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm font-medium text-purple-700 hover:bg-purple-100"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(course)}
                      disabled={deletingCourseId === course.id}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingCourseId === course.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {inProgressCoursesData.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-purple-600" />
              Cursos en progreso
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressCoursesData.map((item) => {
                if (!item.course) return null;
                return (
                  <div key={item.course.id}>
                    <CourseCard course={item.course} />
                    <div className="mt-3 bg-white rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Progreso</span>
                        <span className="text-sm font-semibold text-purple-600">{item.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-purple-600" />
            Cursos guardados
          </h2>
          {savedCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookMarked className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tienes cursos guardados</h3>
              <p className="text-gray-600">Explora y guarda cursos que te interesen.</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-green-600" />
            Cursos completados
          </h2>
          {completedCourses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCourses.map((course) => (
                <div key={course.id} className="relative">
                  <CourseCard course={course} />
                  <div className="absolute top-3 left-3 bg-green-600 text-white p-2 rounded-full">
                    <Trophy className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aun no has completado ningun curso</h3>
              <p className="text-gray-600">Empieza a aprender y completa tu primer curso.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
