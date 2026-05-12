export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  image: string;
  category: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  duration: string;
  isPaid: boolean;
  price?: number;
  creator: {
    name: string;
    avatar: string;
    uid?: string;
    email?: string;
  };
  rating: number;
  reviews: number;
  lessons: Lesson[];
  tags?: string[];
  students?: number;
  createdAt?: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  completed?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const categories: Category[] = [
  { id: '1', name: 'Hogar', icon: 'home', color: 'bg-purple-100 text-purple-600' },
  { id: '2', name: 'Tecnología', icon: 'laptop', color: 'bg-blue-100 text-blue-600' },
  { id: '3', name: 'Cocina', icon: 'chefHat', color: 'bg-orange-100 text-orange-600' },
  { id: '4', name: 'Estudio', icon: 'bookOpen', color: 'bg-green-100 text-green-600' },
  { id: '5', name: 'Trabajo', icon: 'briefcase', color: 'bg-indigo-100 text-indigo-600' },
];

export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Cómo doblar ropa perfectamente',
    description: 'Aprende técnicas profesionales para doblar y organizar tu ropa de manera eficiente. Este curso te enseñará el método KonMari y otros métodos populares para maximizar el espacio en tu armario.',
    shortDescription: 'Técnicas profesionales para organizar tu armario',
    image: 'https://images.unsplash.com/photo-1596433904747-e8b061219a71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbml6aW5nJTIwaG9tZSUyMGZvbGRpbmclMjBjbG90aGVzfGVufDF8fHx8MTc3MjU3NDczMXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Hogar',
    level: 'Principiante',
    duration: '15 min',
    isPaid: false,
    creator: {
      name: 'María González',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    },
    rating: 4.8,
    reviews: 234,
    lessons: [
      { id: 'l1', title: 'Introducción al método KonMari', duration: '3 min' },
      { id: 'l2', title: 'Doblar camisetas paso a paso', duration: '5 min' },
      { id: 'l3', title: 'Organizar pantalones y jeans', duration: '4 min' },
      { id: 'l4', title: 'Trucos para maximizar espacio', duration: '3 min' },
    ],
  },
  {
    id: '2',
    title: 'Cocinar arroz perfecto siempre',
    description: 'Domina el arte de cocinar arroz blanco, integral y para sushi. Aprende las proporciones exactas y los tiempos de cocción para conseguir siempre resultados perfectos.',
    shortDescription: 'Técnicas esenciales para cocinar cualquier tipo de arroz',
    image: 'https://images.unsplash.com/photo-1695654673414-1328cc09c494?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb29raW5nJTIwcmljZSUyMGtpdGNoZW58ZW58MXx8fHwxNzcyNTc0NzMyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Cocina',
    level: 'Principiante',
    duration: '12 min',
    isPaid: false,
    creator: {
      name: 'Chef Carlos Ruiz',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    },
    rating: 4.9,
    reviews: 456,
    lessons: [
      { id: 'l1', title: 'Tipos de arroz y sus usos', duration: '3 min' },
      { id: 'l2', title: 'Arroz blanco perfecto', duration: '5 min' },
      { id: 'l3', title: 'Arroz integral paso a paso', duration: '4 min' },
    ],
  },
  {
    id: '3',
    title: 'Organiza tu tiempo como un profesional',
    description: 'Aprende técnicas probadas de gestión del tiempo como Pomodoro, time blocking y GTD. Descubre cómo priorizar tareas y aumentar tu productividad diaria.',
    shortDescription: 'Técnicas de productividad para gestionar tu día',
    image: 'https://images.unsplash.com/photo-1764818959134-fcf516773c39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aW1lJTIwbWFuYWdlbWVudCUyMHBsYW5uZXIlMjBzdHVkeXxlbnwxfHx8fDE3NzI1NzQ3MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Estudio',
    level: 'Intermedio',
    duration: '25 min',
    isPaid: true,
    price: 4.99,
    creator: {
      name: 'Ana Martínez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    },
    rating: 4.7,
    reviews: 189,
    lessons: [
      { id: 'l1', title: 'Introducción a la gestión del tiempo', duration: '4 min' },
      { id: 'l2', title: 'La técnica Pomodoro', duration: '6 min' },
      { id: 'l3', title: 'Time blocking y planificación semanal', duration: '8 min' },
      { id: 'l4', title: 'Priorizar con la matriz de Eisenhower', duration: '7 min' },
    ],
  },
  {
    id: '4',
    title: 'Introducción a la programación web',
    description: 'Da tus primeros pasos en el desarrollo web. Aprende HTML, CSS básico y conceptos fundamentales para crear tu primera página web desde cero.',
    shortDescription: 'Primeros pasos en desarrollo web para principiantes',
    image: 'https://images.unsplash.com/photo-1771408427146-09be9a1d4535?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjB0ZWNobm9sb2d5JTIwbGVhcm5pbmd8ZW58MXx8fHwxNzcyNTc0NzMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Tecnología',
    level: 'Principiante',
    duration: '45 min',
    isPaid: true,
    price: 9.99,
    creator: {
      name: 'Luis Fernández',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luis',
    },
    rating: 4.9,
    reviews: 567,
    lessons: [
      { id: 'l1', title: 'Qué es HTML y su estructura', duration: '8 min' },
      { id: 'l2', title: 'Etiquetas básicas de HTML', duration: '10 min' },
      { id: 'l3', title: 'Introducción a CSS', duration: '12 min' },
      { id: 'l4', title: 'Tu primera página web', duration: '15 min' },
    ],
  },
  {
    id: '5',
    title: 'Técnicas de estudio efectivas',
    description: 'Mejora tu rendimiento académico con técnicas científicamente probadas. Aprende a tomar apuntes eficientes, memorizar información y preparar exámenes.',
    shortDescription: 'Métodos comprobados para estudiar mejor',
    image: 'https://images.unsplash.com/photo-1758612898701-e2f2958f219d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHN0dWRlbnQlMjBzdHVkeWluZyUyMGRlc2t8ZW58MXx8fHwxNzcyNTc0NzMzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Estudio',
    level: 'Principiante',
    duration: '30 min',
    isPaid: false,
    creator: {
      name: 'Prof. Laura Sánchez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Laura',
    },
    rating: 4.8,
    reviews: 345,
    lessons: [
      { id: 'l1', title: 'El método Cornell para tomar apuntes', duration: '7 min' },
      { id: 'l2', title: 'Técnicas de memorización', duration: '8 min' },
      { id: 'l3', title: 'Mapas mentales y resúmenes', duration: '8 min' },
      { id: 'l4', title: 'Cómo preparar un examen', duration: '7 min' },
    ],
  },
  {
    id: '6',
    title: 'Rutinas matutinas productivas',
    description: 'Diseña tu rutina matutina ideal para empezar el día con energía y enfoque. Incluye ejercicios, meditación y planificación diaria.',
    shortDescription: 'Crea hábitos matutinos que transformen tu día',
    image: 'https://images.unsplash.com/photo-1769138885145-c888986cade2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBtb3JuaW5nJTIwcm91dGluZSUyMGJyZWFrZmFzdHxlbnwxfHx8fDE3NzI1NzQ3MzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Hogar',
    level: 'Principiante',
    duration: '20 min',
    isPaid: false,
    creator: {
      name: 'Diego Torres',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diego',
    },
    rating: 4.6,
    reviews: 278,
    lessons: [
      { id: 'l1', title: 'Beneficios de las rutinas matutinas', duration: '4 min' },
      { id: 'l2', title: 'Ejercicios de activación', duration: '6 min' },
      { id: 'l3', title: 'Meditación para principiantes', duration: '5 min' },
      { id: 'l4', title: 'Planifica tu día en 5 minutos', duration: '5 min' },
    ],
  },
  {
    id: '7',
    title: 'Excel básico para el trabajo',
    description: 'Domina las funciones esenciales de Excel que todo profesional necesita. Desde fórmulas básicas hasta gráficos y tablas dinámicas.',
    shortDescription: 'Habilidades de Excel para aumentar tu eficiencia',
    image: 'https://images.unsplash.com/photo-1660145177383-e6e2c22adb5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwcHJvZHVjdGl2aXR5JTIwd29ya3NwYWNlfGVufDF8fHx8MTc3MjU2NjExM3ww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Trabajo',
    level: 'Principiante',
    duration: '35 min',
    isPaid: true,
    price: 7.99,
    creator: {
      name: 'Carmen López',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carmen',
    },
    rating: 4.9,
    reviews: 412,
    lessons: [
      { id: 'l1', title: 'Navegación y formato básico', duration: '6 min' },
      { id: 'l2', title: 'Fórmulas esenciales (SUMA, PROMEDIO)', duration: '9 min' },
      { id: 'l3', title: 'Crear gráficos efectivos', duration: '10 min' },
      { id: 'l4', title: 'Introducción a tablas dinámicas', duration: '10 min' },
    ],
  },
  {
    id: '8',
    title: 'Limpieza y organización del hogar',
    description: 'Aprende a mantener tu hogar limpio y organizado con rutinas simples. Incluye trucos de limpieza profunda y organización por habitaciones.',
    shortDescription: 'Rutinas efectivas para un hogar ordenado',
    image: 'https://images.unsplash.com/photo-1758272422189-b10f36fd4ddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwb3JnYW5pemF0aW9uJTIwY2xlYW5pbmd8ZW58MXx8fHwxNzcyNDk2NTA4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Hogar',
    level: 'Principiante',
    duration: '18 min',
    isPaid: false,
    creator: {
      name: 'Elena Morales',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    },
    rating: 4.7,
    reviews: 301,
    lessons: [
      { id: 'l1', title: 'Rutina diaria de 10 minutos', duration: '4 min' },
      { id: 'l2', title: 'Limpieza profunda de cocina', duration: '5 min' },
      { id: 'l3', title: 'Organizar el baño eficientemente', duration: '4 min' },
      { id: 'l4', title: 'Trucos para mantener el orden', duration: '5 min' },
    ],
  },
];

export const userProfile = {
  name: 'Alejandro Pérez',
  email: 'alejandro@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alejandro',
  savedCourses: ['1', '3', '5'],
  completedCourses: ['2'],
  inProgressCourses: [
    { courseId: '4', progress: 50 },
    { courseId: '7', progress: 25 },
  ],
};
