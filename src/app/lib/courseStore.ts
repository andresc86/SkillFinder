import { collection, deleteDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';
import { categories, mockCourses, userProfile, type Course, type Lesson } from '../data/mockData';

const CREATED_COURSES_KEY = 'skillfinder.createdCourses';
const SAVED_COURSES_KEY = 'skillfinder.savedCourses';
const STARTED_COURSES_KEY = 'skillfinder.startedCourses';
const OWNED_COURSES_KEY = 'skillfinder.ownedCourses';
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

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function buildDefaultAvatar(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || 'SkillFinder')}`;
}

function getCurrentUserIdentity() {
  const currentUser = auth.currentUser;
  if (currentUser?.uid) return currentUser.uid;
  if (currentUser?.email) return currentUser.email;
  return 'guest';
}

function getScopedStorageKey(baseKey: string) {
  return `${baseKey}:${getCurrentUserIdentity()}`;
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

function mergeWithAuthProfile(profile: UserProfileState): UserProfileState {
  const currentUser = auth.currentUser;
  if (!currentUser) return profile;

  return {
    ...profile,
    name: currentUser.displayName || profile.name,
    email: currentUser.email || profile.email,
    avatar:
      currentUser.photoURL ||
      profile.avatar ||
      buildDefaultAvatar(currentUser.displayName || currentUser.email || profile.name),
  };
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
    return rawLessons.filter(Boolean).map((lesson, index) => {
      const candidate = lesson as Partial<Lesson>;
      return {
        id: candidate.id || `lesson-${index + 1}`,
        title: candidate.title || `Leccion ${index + 1}`,
        duration: candidate.duration || '0 min',
        videoUrl: candidate.videoUrl,
        completed: candidate.completed,
      };
    });
  }

  if (typeof rawLessons === 'string') {
    try {
      const parsed = JSON.parse(rawLessons);
      return Array.isArray(parsed) ? parseLessonsField(parsed) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeCreatedAt(rawCreatedAt: unknown) {
  if (!rawCreatedAt) return new Date().toISOString();
  if (typeof rawCreatedAt === 'string') return rawCreatedAt;
  if (typeof rawCreatedAt === 'object' && rawCreatedAt !== null && 'toDate' in rawCreatedAt) {
    const maybeTimestamp = rawCreatedAt as { toDate?: () => Date };
    return typeof maybeTimestamp.toDate === 'function'
      ? maybeTimestamp.toDate().toISOString()
      : new Date().toISOString();
  }

  return new Date().toISOString();
}

function normalizeFirebaseCourse(id: string, data: Record<string, unknown>): Course {
  const description = typeof data.description === 'string' ? data.description : '';
  const creatorSource =
    typeof data.creator === 'object' && data.creator !== null
      ? (data.creator as Record<string, unknown>)
      : undefined;

  return {
    id,
    title: typeof data.title === 'string' ? data.title : '',
    description,
    shortDescription:
      typeof data.shortDescription === 'string'
        ? data.shortDescription
        : createShortDescription(description),
    image: typeof data.image === 'string' ? data.image : '',
    category: typeof data.category === 'string' ? data.category : '',
    level: (data.level as Course['level']) || 'Principiante',
    duration: typeof data.duration === 'string' ? data.duration : '0 min',
    isPaid: Boolean(data.isPaid),
    price: typeof data.price === 'number' ? data.price : undefined,
    creator: {
      name:
        typeof creatorSource?.name === 'string'
          ? creatorSource.name
          : 'Autor de SkillFinder',
      avatar:
        typeof creatorSource?.avatar === 'string'
          ? creatorSource.avatar
          : buildDefaultAvatar('SkillFinder'),
      uid: typeof creatorSource?.uid === 'string' ? creatorSource.uid : undefined,
      email: typeof creatorSource?.email === 'string' ? creatorSource.email : undefined,
    },
    rating: typeof data.rating === 'number' ? data.rating : 0,
    reviews: typeof data.reviews === 'number' ? data.reviews : 0,
    lessons: parseLessonsField(data.lessons),
    tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    students: typeof data.students === 'number' ? data.students : 0,
    createdAt: normalizeCreatedAt(data.createdAtServer ?? data.createdAt),
  };
}

export function getProfile() {
  const currentUser = auth.currentUser;
  const fallbackProfile: UserProfileState = {
    ...defaultProfile,
    name: currentUser?.displayName || defaultProfile.name,
    email: currentUser?.email || defaultProfile.email,
    avatar:
      currentUser?.photoURL ||
      buildDefaultAvatar(currentUser?.displayName || currentUser?.email || defaultProfile.name),
  };

  const storedProfile = readJson<UserProfileState>(getScopedStorageKey(PROFILE_KEY), fallbackProfile);
  return mergeWithAuthProfile(storedProfile);
}

export function updateProfile(
  profilePatch: Partial<Pick<UserProfileState, 'name' | 'email' | 'avatar' | 'bio' | 'headline'>>
) {
  const updatedProfile = { ...getProfile(), ...profilePatch };
  writeJson(getScopedStorageKey(PROFILE_KEY), updatedProfile);
  emitSkillFinderUpdate();
  return updatedProfile;
}

export function getSavedCourseIds() {
  const savedFromProfile = getProfile().savedCourses;
  return readJson<string[]>(getScopedStorageKey(SAVED_COURSES_KEY), savedFromProfile);
}

export function isCourseSaved(courseId: string) {
  return getSavedCourseIds().includes(courseId);
}

export function toggleSavedCourse(courseId: string) {
  const profile = getProfile();
  const currentSavedIds = getSavedCourseIds();
  const updated = currentSavedIds.includes(courseId)
    ? currentSavedIds.filter((id) => id !== courseId)
    : [...currentSavedIds, courseId];

  writeJson(getScopedStorageKey(PROFILE_KEY), { ...profile, savedCourses: updated });
  writeJson(getScopedStorageKey(SAVED_COURSES_KEY), updated);
  emitSkillFinderUpdate();

  return updated.includes(courseId);
}

export function getStartedCourseIds() {
  const defaults = defaultProfile.inProgressCourses.map((course) => course.courseId);
  return readJson<string[]>(getScopedStorageKey(STARTED_COURSES_KEY), defaults);
}

function ensureInProgressCourse(courseId: string, progress = 5) {
  const profile = getProfile();
  const alreadyExists = profile.inProgressCourses.some((course) => course.courseId === courseId);
  if (alreadyExists) return;

  writeJson(getScopedStorageKey(PROFILE_KEY), {
    ...profile,
    inProgressCourses: [...profile.inProgressCourses, { courseId, progress }],
  });
}

export function startCourse(courseId: string) {
  const current = getStartedCourseIds();
  if (!current.includes(courseId)) {
    writeJson(getScopedStorageKey(STARTED_COURSES_KEY), [...current, courseId]);
  }

  ensureInProgressCourse(courseId);
  emitSkillFinderUpdate();
}

export function hasStartedCourse(courseId: string) {
  return getStartedCourseIds().includes(courseId);
}

export function getOwnedCourseIds() {
  return readJson<string[]>(getScopedStorageKey(OWNED_COURSES_KEY), []);
}

export function recordOwnedCourseId(courseId: string) {
  const nextOwnedCourseIds = Array.from(new Set([courseId, ...getOwnedCourseIds()]));
  writeJson(getScopedStorageKey(OWNED_COURSES_KEY), nextOwnedCourseIds);
  emitSkillFinderUpdate();
}

function removeOwnedCourseId(courseId: string) {
  const nextOwnedCourseIds = getOwnedCourseIds().filter((id) => id !== courseId);
  writeJson(getScopedStorageKey(OWNED_COURSES_KEY), nextOwnedCourseIds);
}

function removeCourseIdFromProfileLists(courseId: string) {
  const profile = getProfile();
  const nextProfile: UserProfileState = {
    ...profile,
    savedCourses: profile.savedCourses.filter((id) => id !== courseId),
    completedCourses: profile.completedCourses.filter((id) => id !== courseId),
    inProgressCourses: profile.inProgressCourses.filter((course) => course.courseId !== courseId),
  };

  writeJson(getScopedStorageKey(PROFILE_KEY), nextProfile);
  writeJson(getScopedStorageKey(SAVED_COURSES_KEY), nextProfile.savedCourses);
  writeJson(
    getScopedStorageKey(STARTED_COURSES_KEY),
    getStartedCourseIds().filter((id) => id !== courseId)
  );
  removeOwnedCourseId(courseId);
}

export function getCreatedCourses() {
  return readJson<Course[]>(CREATED_COURSES_KEY, []);
}

export async function getFirebaseCourses() {
  const snapshot = await getDocs(collection(db, 'courses'));
  return snapshot.docs
    .map((docSnapshot) => normalizeFirebaseCourse(docSnapshot.id, docSnapshot.data() as Record<string, unknown>))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

export async function getFirebaseCourseById(courseId: string) {
  const docRef = doc(db, 'courses', courseId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return normalizeFirebaseCourse(docSnap.id, docSnap.data() as Record<string, unknown>);
}

export async function deleteFirebaseCourse(courseId: string) {
  await deleteDoc(doc(db, 'courses', courseId));
  removeCourseIdFromProfileLists(courseId);
  emitSkillFinderUpdate();
}

export function isCourseOwner(
  courseId: string | undefined,
  creator: Course['creator'] | undefined,
  user: { uid?: string | null; email?: string | null; displayName?: string | null } | null
) {
  if (courseId && getOwnedCourseIds().includes(courseId)) return true;
  if (!creator || !user) return false;

  if (creator.uid && user.uid && creator.uid === user.uid) return true;
  if (creator.email && user.email && creator.email === user.email) return true;
  if (
    creator.name &&
    user.displayName &&
    creator.name.trim().toLowerCase() === user.displayName.trim().toLowerCase()
  ) {
    return true;
  }

  const profile = getProfile();

  if (creator.email && profile.email && creator.email === profile.email) return true;
  if (
    creator.name &&
    profile.name &&
    creator.name.trim().toLowerCase() === profile.name.trim().toLowerCase()
  ) {
    return true;
  }

  if (!creator.uid && !creator.email && (!creator.name || creator.name === 'Autor de SkillFinder')) {
    return Boolean(courseId && getOwnedCourseIds().includes(courseId));
  }

  return false;
}

export function getAllCourses() {
  return [...getCreatedCourses(), ...mockCourses];
}

export async function getPublishedCourses() {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const firebaseCourses = await getFirebaseCourses();
  return firebaseCourses.filter((course) => isCourseOwner(course.id, course.creator, currentUser));
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
  const currentUser = auth.currentUser;
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
      uid: currentUser?.uid,
      email: currentUser?.email || profile.email,
    },
    rating: 0,
    reviews: 0,
    lessons: input.lessons,
    tags: input.tags,
    students: 0,
    createdAt: new Date().toISOString(),
  };

  const updated = [course, ...getCreatedCourses()];
  writeJson(CREATED_COURSES_KEY, updated);
  recordOwnedCourseId(course.id);
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
