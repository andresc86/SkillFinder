import { Upload, Plus, X, CircleAlert, CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Navbar } from '../components/Navbar';
import { categories, type Lesson } from '../data/mockData';
import { useAuthUser } from '../hooks/useAuthUser';
import {
  formatMinutes,
  getFirebaseCourseById,
  getLessonsDuration,
  getProfile,
  isCourseOwner,
  levelOptions,
  recordOwnedCourseId,
} from '../lib/courseStore';
import { uploadToCloudinary } from '../lib/cloudinary';
import { db } from '../../services/firebaseConfig';

interface LessonForm extends Lesson {
  videoPreview?: string;
  videoName?: string;
  videoFile?: File | null;
}

interface FirestoreLesson {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  level?: string;
  image?: string;
  price?: string;
  lessons?: string;
  form?: string;
}

const defaultImage =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200';
const MAX_VIDEO_SIZE_MB = 20;
const MAX_IMAGE_SIZE_MB = 5;

function createShortDescription(description: string) {
  return description.length > 90 ? `${description.slice(0, 87).trim()}...` : description;
}

function sanitizeLessons(lessons: FirestoreLesson[]) {
  return lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    duration: lesson.duration,
    ...(lesson.videoUrl ? { videoUrl: lesson.videoUrl } : {}),
  }));
}

function normalizeEditableLessons(lessons: Lesson[]) {
  return lessons.map((lesson, index) => ({
    id: lesson.id || `lesson-${index + 1}`,
    title: lesson.title || '',
    duration: lesson.duration || '',
    videoUrl: lesson.videoUrl || '',
    videoPreview: lesson.videoUrl || '',
    videoName: lesson.videoUrl ? 'Video guardado' : '',
    videoFile: null,
  }));
}

export default function CreateCourse() {
  const navigate = useNavigate();
  const { id: courseId } = useParams();
  const isEditMode = Boolean(courseId);
  const { user, loading: authLoading } = useAuthUser();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: '',
    isPaid: false,
    price: '',
    tags: '',
  });
  const [lessons, setLessons] = useState<LessonForm[]>([]);
  const [newLesson, setNewLesson] = useState({
    title: '',
    duration: '',
    videoPreview: '',
    videoName: '',
    videoFile: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'success'>('idle');

  const totalDuration = useMemo(() => formatMinutes(getLessonsDuration(lessons)), [lessons]);

  useEffect(() => {
    const loadCourse = async () => {
      if (!isEditMode || !courseId || authLoading) return;

      try {
        setStatus('loading');
        const course = await getFirebaseCourseById(courseId);

        if (!course) {
          setErrors({ form: 'No encontramos el curso que intentas editar.' });
          setStatus('idle');
          return;
        }

        if (!isCourseOwner(course.id, course.creator, user)) {
          setErrors({ form: 'Solo el perfil creador puede editar este curso.' });
          setStatus('idle');
          return;
        }

        setFormData({
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          isPaid: course.isPaid,
          price: course.price ? String(course.price) : '',
          tags: (course.tags || []).join(', '),
        });
        setImagePreview(course.image || '');
        setImageFile(null);
        setLessons(normalizeEditableLessons(course.lessons));
        setStatus('idle');
      } catch (error) {
        console.error('Error al cargar curso para editar:', error);
        setErrors({ form: 'No se pudo cargar el curso para editar.' });
        setStatus('idle');
      }
    };

    loadCourse();
  }, [authLoading, courseId, isEditMode, user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Sube un archivo de imagen valido.' }));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: `La portada no puede superar ${MAX_IMAGE_SIZE_MB} MB.`,
      }));
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setErrors((prev) => ({ ...prev, image: undefined, form: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const handleLessonVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setErrors((prev) => ({
        ...prev,
        lessons: 'Sube un archivo de video valido para la leccion.',
      }));
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        lessons: `El video de la leccion no puede superar ${MAX_VIDEO_SIZE_MB} MB.`,
      }));
      return;
    }

    const videoPreview = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(new Error('No se pudo leer el video.'));
      reader.readAsDataURL(file);
    }).catch(() => '');

    if (!videoPreview) {
      setErrors((prev) => ({
        ...prev,
        lessons: 'No se pudo cargar el video de la leccion.',
      }));
      return;
    }

    setNewLesson((prev) => ({
      ...prev,
      videoPreview,
      videoName: file.name,
      videoFile: file,
    }));
    setErrors((prev) => ({ ...prev, lessons: undefined, form: undefined }));
  };

  const addLesson = () => {
    if (!newLesson.title.trim() || !newLesson.duration.trim()) {
      setErrors((prev) => ({
        ...prev,
        lessons: 'Cada leccion necesita titulo y duracion.',
      }));
      return;
    }

    setLessons((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        title: newLesson.title.trim(),
        duration: newLesson.duration.trim(),
        videoPreview: newLesson.videoPreview || undefined,
        videoName: newLesson.videoName || undefined,
        videoFile: newLesson.videoFile || null,
      },
    ]);
    setNewLesson({ title: '', duration: '', videoPreview: '', videoName: '', videoFile: null });
    setErrors((prev) => ({ ...prev, lessons: undefined, form: undefined }));
  };

  const removeLesson = (id: string) => {
    setLessons((prev) => prev.filter((lesson) => lesson.id !== id));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!user) {
      nextErrors.form = 'Debes iniciar sesion para publicar o editar un curso.';
    }

    if (!formData.title.trim() || formData.title.trim().length < 8) {
      nextErrors.title = 'Pon un titulo mas claro, de al menos 8 caracteres.';
    }

    if (!formData.description.trim() || formData.description.trim().length < 40) {
      nextErrors.description =
        'Describe mejor el curso. Intenta escribir al menos 40 caracteres.';
    }

    if (!formData.category.trim()) {
      nextErrors.category = 'Selecciona una categoria.';
    }

    if (!formData.level.trim()) {
      nextErrors.level = 'Selecciona un nivel.';
    }

    if (!imagePreview) {
      nextErrors.image = 'Agrega una portada para el curso.';
    }

    if (formData.isPaid) {
      const priceNumber = Number(formData.price);
      if (!formData.price || Number.isNaN(priceNumber) || priceNumber <= 0) {
        nextErrors.price = 'Ingresa un precio valido mayor que 0.';
      }
    }

    if (lessons.length === 0) {
      nextErrors.lessons = 'Agrega al menos una leccion antes de publicar.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) return;

    try {
      setStatus('saving');
      const profile = getProfile();
      const normalizedDescription = formData.description.trim();
      const normalizedTags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const uploadedImageUrl = imageFile
        ? await uploadToCloudinary(imageFile, 'image')
        : imagePreview || defaultImage;

      const uploadedLessons = await Promise.all(
        lessons.map(async (lesson) => {
          const uploadedVideoUrl = lesson.videoFile
            ? await uploadToCloudinary(lesson.videoFile, 'video')
            : lesson.videoUrl;

          return {
            id: lesson.id,
            title: lesson.title,
            duration: lesson.duration,
            videoUrl: uploadedVideoUrl,
          } satisfies FirestoreLesson;
        })
      );

      const payload = {
        title: formData.title.trim(),
        description: normalizedDescription,
        shortDescription: createShortDescription(normalizedDescription),
        category: formData.category,
        level: formData.level,
        duration: totalDuration,
        isPaid: formData.isPaid,
        price: formData.isPaid ? Number(formData.price) : 0,
        image: uploadedImageUrl,
        creator: {
          name: user.displayName || profile.name,
          avatar: user.photoURL || profile.avatar,
          uid: user.uid,
          email: user.email || profile.email,
        },
        lessons: JSON.stringify(sanitizeLessons(uploadedLessons)),
        tags: normalizedTags,
      };

      if (isEditMode && courseId) {
        await updateDoc(doc(db, 'courses', courseId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        setStatus('success');
        window.setTimeout(() => {
          navigate(`/course/${courseId}`);
        }, 900);
        return;
      }

      const createdAt = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'courses'), {
        ...payload,
        rating: 5,
        reviews: 0,
        students: 0,
        createdAt,
        createdAtServer: serverTimestamp(),
      });

      recordOwnedCourseId(docRef.id);
      setStatus('success');

      window.setTimeout(() => {
        navigate(`/course/${docRef.id}`);
      }, 1200);
    } catch (error: any) {
      console.error('Error al guardar curso:', error);
      setStatus('idle');
      alert(`Error real: ${error?.message || 'No se pudo guardar el curso'}`);
    }
  };

  if (authLoading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Cargando curso...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? 'Editar curso' : 'Crear nuevo curso'}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? 'Actualiza el contenido del curso y agrega nuevas lecciones.'
              : 'Comparte tu conocimiento con la comunidad sin cambiar el estilo visual de tu plataforma.'}
          </p>
        </div>

        {status === 'success' && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">Curso guardado</p>
              <p className="text-sm">
                {isEditMode
                  ? 'Los cambios se guardaron correctamente.'
                  : 'El curso se guardo en Firebase y te estoy llevando a la vista del curso.'}
              </p>
            </div>
          </div>
        )}

        {errors.form && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <CircleAlert className="mt-0.5 h-5 w-5" />
            <p className="text-sm">{errors.form}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-900">Imagen del curso</span>
              <p className="text-sm text-gray-500 mb-3">
                Sube una portada atractiva para darle mas realismo al proyecto.
              </p>
            </label>

            <div className="relative">
              {imagePreview ? (
                <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-gray-200">
                  <img
                    src={imagePreview}
                    alt="Vista previa del curso"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview('');
                      setImageFile(null);
                    }}
                    className="absolute top-3 right-3 bg-white/90 p-2 rounded-full hover:bg-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-colors">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-700 font-medium mb-1">Haz clic para subir una imagen</p>
                  <p className="text-sm text-gray-500">PNG, JPG o WEBP. Maximo {MAX_IMAGE_SIZE_MB} MB</p>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {errors.image && <p className="mt-3 text-sm text-red-600">{errors.image}</p>}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
                Titulo del curso
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ej: Aprende a usar Figma desde cero"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
                Descripcion
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                placeholder="Explica que aprendera la persona, como esta estructurado el curso y para quien es util."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-900 mb-2">
                  Categoria
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecciona una categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-2 text-sm text-red-600">{errors.category}</p>}
              </div>

              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-900 mb-2">
                  Nivel
                </label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecciona un nivel</option>
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                {errors.level && <p className="mt-2 text-sm text-red-600">{errors.level}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-purple-300">
                <input
                  type="checkbox"
                  name="isPaid"
                  checked={formData.isPaid}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <span className="font-medium text-gray-900">Curso de pago</span>
                  <p className="text-sm text-gray-500">Activalo si quieres mostrarlo como contenido premium.</p>
                </div>
              </label>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-900 mb-2">
                  Precio
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!formData.isPaid}
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                />
                {errors.price && <p className="mt-2 text-sm text-red-600">{errors.price}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-900 mb-2">
                Etiquetas
              </label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="Ej: figma, diseno, interfaz"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                Separalas por coma para mejorar la busqueda del curso.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Lecciones del curso</h2>
                <p className="text-sm text-gray-500">
                  Duracion total estimada: {lessons.length ? totalDuration : '0 min'}
                </p>
              </div>

              {errors.lessons && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  <CircleAlert className="w-4 h-4" />
                  {errors.lessons}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={newLesson.title}
                onChange={(e) => setNewLesson((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Titulo de la leccion"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                value={newLesson.duration}
                onChange={(e) => setNewLesson((prev) => ({ ...prev, duration: e.target.value }))}
                placeholder="Ej: 8 min"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid md:grid-cols-[1fr_auto] gap-4 mb-4">
              <label className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-gray-300 px-4 py-3 cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-colors">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    {newLesson.videoName || 'Subir video de la leccion'}
                  </p>
                  <p className="text-sm text-gray-500">
                    MP4, WEBM u otro formato de video. Maximo {MAX_VIDEO_SIZE_MB} MB.
                  </p>
                </div>
                <Upload className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input type="file" accept="video/*" onChange={handleLessonVideoUpload} className="hidden" />
              </label>

              <button
                type="button"
                onClick={addLesson}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium"
              >
                <Plus className="w-5 h-5" />
                Agregar
              </button>
            </div>

            {newLesson.videoPreview && (
              <div className="mb-4 rounded-xl border border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {newLesson.videoName || 'Video cargado'}
                    </p>
                    <p className="text-sm text-gray-500">Este video se subira a Cloudinary al guardar.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNewLesson((prev) => ({
                        ...prev,
                        videoPreview: '',
                        videoName: '',
                        videoFile: null,
                      }))
                    }
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <video src={newLesson.videoPreview} controls className="w-full rounded-xl bg-black" />
              </div>
            )}

            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-200 px-4 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{lesson.title}</p>
                    <p className="text-sm text-gray-500">
                      {lesson.duration}
                      {lesson.videoFile || lesson.videoUrl ? ' - Con video' : ' - Sin video'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLesson(lesson.id)}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={status === 'saving'}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl font-medium"
            >
              {status === 'saving'
                ? isEditMode
                  ? 'Guardando cambios...'
                  : 'Publicando...'
                : isEditMode
                  ? 'Guardar cambios'
                  : 'Publicar curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
