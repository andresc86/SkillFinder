import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { categories, mockCourses, userProfile, type Course, type Lesson } from '../data/mockData';

const CREATED_COURSES_KEY = 'skillfinder.createdCourses';
const STARTED_COURSES_KEY = 'skillfinder.startedCourses';
const PROFILE_KEY = 'skillfinder.profile';
const STORAGE_EVENT = 'skillfinder:update';

export const levelOptions: Course['level'][] = ['Principiante', 'Intermedio', 'Avanzado'];
export const pricingOptions = ['Gratis', 'Pago'] as const;
export const durationOptions = [
  { value: 'short', label: 'Corto (<=15 min)' },
  { value: 'medium', label: 'Medio (15-30 min)' },
  { value: 'long', label: 'Largo (>30 min)' },
] as const;
export const sortOptions = [
  { value: 'relevance', label: 'Mas relevantes' },
  { value: 'rating', label: 'Mejor valorados' },
  { value: 'recent', label: 'Mas recientes' },
  { value: 'duration', label: 'Mas cortos primero' },
  { value: 'price-asc', label: 'Menor precio' },
] as const;

export interface UserProfileState {
  name: string;
  email: string;
  avatar: string;
  bio: string;
  headline: string;
  savedCourses: string[];
  completedCourses: string[];
  inProgressCourses: { courseId: string; progress: number }[];
}

const defaultProfile: UserProfileState = {
  ...userProfile,
  bio: 'Aprendiz constante y creador de cursos practicos para la vida diaria.',
  headline: 'Estudiante y creador en SkillFinder',
};

function buildDefaultAvatar(name: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'SkillFinder')}`;
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function emitSkillFinderUpdate() {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function subscribeToSkillFinderUpdates(callback: () => void) {
  if (!canUseStorage()) return () => undefined;

  window.addEventListener(STORAGE_EVENT, callback);
  window.addEventListener('storage', callback);

  return () => {
    window.removeEventListener(STORAGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

export function parseDurationToMinutes(value: string) {
  const text = value.toLowerCase().trim();
  const hourMatch = text.match(/(\d+)\s*h/);
  const minuteMatch = text.match(/(\d+)\s*min/);

  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;

  if (!hours && !minutes) {
    const fallbackNumber = Number.parseInt(text, 10);
    return Number.isNaN(fallbackNumber) ? 0 : fallbackNumber;
  }

  return hours * 60 + minutes;
}

export function formatMinutes(totalMinutes: number) {
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
  }

  return `${totalMinutes} min`;
}

export function getLessonsDuration(lessons: Lesson[]) {
  return lessons.reduce((total, lesson) => total + parseDurationToMinutes(lesson.duration), 0);
}

function createShortDescription(description: string) {
  return description.length > 90 ? `${description.slice(0, 87).trim()}...` : description;
}

function parseLessonsField(rawLessons: unknown): Lesson[] {
  if (Array.isArray(rawLessons)) {
    return rawLessons as Lesson[];
  }

  if (typeof rawLessons === 'string') {
    try {
      const parsed = JSON.parse(rawLessons);
      return Array.isArray(parsed) ? (parsed as Lesson[]) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeFirebaseCourse(id: string, data: Record<string, unknown>): Course {
  const lessons = parseLessonsField(data.lessons);
  const creator = (data.creator as Course['creator'] | undefined) ?? {
    name: 'Autor de SkillFinder',
    avatar: buildDefaultAvatar('SkillFinder'),
  };

  return {
    id,
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    shortDescription: String(
      data.shortDescription ?? createShortDescription(String(data.description ?? ''))
    ),
    image: String(data.image ?? ''),
    category: String(data.category ?? ''),
    level: (data.level as Course['level']) ?? 'Principiante',
    duration: String(data.duration ?? '0 min'),
    isPaid: Boolean(data.isPaid),
    price: typeof data.price === 'number' ? data.price : undefined,
    creator,
    rating: typeof data.rating === 'number' ? data.rating : 5,
    reviews: typeof data.reviews === 'number' ? data.reviews : 0,
    lessons,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    students: typeof data.students === 'number' ? data.students : 0,
    createdAt: String(data.createdAt ?? new Date().toISOString()),
  };
}

export function getProfile() {
  const storedProfile = readJson<UserProfileState>(PROFILE_KEY, defaultProfile);
  const currentUser = auth.currentUser;

  if (!currentUser) {
    return storedProfile;
  }

  const shouldUseAuthName = !storedProfile.name || storedProfile.name === defaultProfile.name;
  const shouldUseAuthEmail = !storedProfile.email || storedProfile.email === defaultProfile.email;
  const shouldUseAuthAvatar =
    !storedProfile.avatar || storedProfile.avatar === defaultProfile.avatar;

  const authName =
    currentUser.displayName?.trim() || storedProfile.name || 'Usuario SkillFinder';
  const authEmail = currentUser.email?.trim() || storedProfile.email;
  const authAvatar = currentUser.photoURL || buildDefaultAvatar(authName);

  return {
    ...storedProfile,
    name: shouldUseAuthName ? authName : storedProfile.name,
    email: shouldUseAuthEmail ? authEmail : storedProfile.email,
    avatar: shouldUseAuthAvatar ? authAvatar : storedProfile.avatar,
  };
}

export function updateProfile(
  profilePatch: Partial<Pick<UserProfileState, 'name' | 'email' | 'avatar' | 'bio' | 'headline'>>
) {
  const updatedProfile = { ...getProfile(), ...profilePatch };
  writeJson(PROFILE_KEY, updatedProfile);
  emitSkillFinderUpdate();
  return updatedProfile;
}

export function getSavedCourseIds() {
  return getProfile().savedCourses;
}

export function isCourseSaved(courseId: string) {
  return getSavedCourseIds().includes(courseId);
}

export function toggleSavedCourse(courseId: string) {
  const profile = getProfile();
  const updated = profile.savedCourses.includes(courseId)
    ? profile.savedCourses.filter((id) => id !== courseId)
    : [...profile.savedCourses, courseId];

  writeJson(PROFILE_KEY, { ...profile, savedCourses: updated });
  emitSkillFinderUpdate();

  return updated.includes(courseId);
}

export function getStartedCourseIds() {
  const defaults = defaultProfile.inProgressCourses.map((course) => course.courseId);
  return readJson<string[]>(STARTED_COURSES_KEY, defaults);
}

function ensureInProgressCourse(courseId: string, progress = 5) {
  const profile = getProfile();
  const alreadyExists = profile.inProgressCourses.some((course) => course.courseId === courseId);
  if (alreadyExists) return;

  writeJson(PROFILE_KEY, {
    ...profile,
    inProgressCourses: [...profile.inProgressCourses, { courseId, progress }],
  });
}

export function startCourse(courseId: string) {
  const current = getStartedCourseIds();
  if (!current.includes(courseId)) {
    writeJson(STARTED_COURSES_KEY, [...current, courseId]);
  }

  ensureInProgressCourse(courseId);
  emitSkillFinderUpdate();
}

export function hasStartedCourse(courseId: string) {
  return getStartedCourseIds().includes(courseId);
}

export function getCreatedCourses() {
  return readJson<Course[]>(CREATED_COURSES_KEY, []);
}

export async function getFirebaseCourses() {
  const snapshot = await getDocs(collection(db, 'courses'));
  return snapshot.docs.map((doc) =>
    normalizeFirebaseCourse(doc.id, doc.data() as Record<string, unknown>)
  );
}

export function getAllCourses() {
  return [...getCreatedCourses(), ...mockCourses];
}

export function getPublishedCourses() {
  return getCreatedCourses().filter((course) => course.creator.name === getProfile().name);
}

export function getCourseById(courseId?: string) {
  return getAllCourses().find((course) => course.id === courseId);
}

export interface PublishCourseInput {
  title: string;
  description: string;
  category: string;
  level: Course['level'];
  duration: string;
  isPaid: boolean;
  price?: number;
  image: string;
  lessons: Lesson[];
  tags: string[];
}

export function publishCourse(input: PublishCourseInput) {
  const profile = getProfile();
  const course: Course = {
    id: `user-${Date.now()}`,
    title: input.title,
    description: input.description,
    shortDescription: createShortDescription(input.description),
    image: input.image,
    category: input.category,
    level: input.level,
    duration: input.duration,
    isPaid: input.isPaid,
    price: input.isPaid ? input.price : undefined,
    creator: {
      name: profile.name,
      avatar: profile.avatar,
    },
    rating: 5,
    reviews: 0,
    lessons: input.lessons,
    tags: input.tags,
    students: 0,
    createdAt: new Date().toISOString(),
  };

  const updated = [course, ...getCreatedCourses()];
  writeJson(CREATED_COURSES_KEY, updated);
  emitSkillFinderUpdate();

  return course;
}

export function matchesCourseSearch(course: Course, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return [course.title, course.description, course.category, course.creator.name, ...(course.tags ?? [])]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery);
}

export function sortCourses(courses: Course[], sort: string) {
  const sorted = [...courses];

  switch (sort) {
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    case 'recent':
      return sorted.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    case 'duration':
      return sorted.sort((a, b) => parseDurationToMinutes(a.duration) - parseDurationToMinutes(b.duration));
    case 'price-asc':
      return sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    default:
      return sorted;
  }
}

export function getAvailableCategories() {
  const dynamicCategories = getCreatedCourses()
    .map((course) => course.category)
    .filter((category) => !categories.some((item) => item.name === category));

  return [...categories.map((category) => category.name), ...dynamicCategories];
}
