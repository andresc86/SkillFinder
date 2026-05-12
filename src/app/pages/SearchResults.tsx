import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Navbar } from '../components/Navbar';
import { CourseCard } from '../components/CourseCard';
import { X, SlidersHorizontal, SearchX } from 'lucide-react';
import {
  durationOptions,
  getFirebaseCourses,
  getAllCourses,
  levelOptions,
  matchesCourseSearch,
  parseDurationToMinutes,
  pricingOptions,
  sortCourses,
  sortOptions,
  subscribeToSkillFinderUpdates,
} from '../lib/courseStore';

interface FiltersState {
  q: string;
  category: string;
  level: string;
  duration: string;
  pricing: string;
  sort: string;
}

const DEFAULT_FILTERS: FiltersState = {
  q: '',
  category: '',
  level: '',
  duration: '',
  pricing: '',
  sort: 'relevance',
};

function getFiltersFromParams(searchParams: URLSearchParams): FiltersState {
  return {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    level: searchParams.get('level') || '',
    duration: searchParams.get('duration') || '',
    pricing: searchParams.get('pricing') || '',
    sort: searchParams.get('sort') || 'relevance',
  };
}

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [firebaseCourses, setFirebaseCourses] = useState<ReturnType<typeof getAllCourses>>([]);

  const filters = useMemo(() => getFiltersFromParams(searchParams), [searchParams]);
  const allCourses = useMemo(() => {
    const remoteIds = new Set(firebaseCourses.map((course) => course.id));
    return [...firebaseCourses, ...getAllCourses().filter((course) => !remoteIds.has(course.id))];
  }, [catalogVersion, firebaseCourses]);
  const availableCategories = useMemo(() => {
    return Array.from(new Set(allCourses.map((course) => course.category).filter(Boolean)));
  }, [allCourses]);

  useEffect(() => {
    setSearchQuery(filters.q);
  }, [filters.q]);

  useEffect(() => subscribeToSkillFinderUpdates(() => setCatalogVersion((value) => value + 1)), []);

  useEffect(() => {
    let mounted = true;

    const loadFirebaseCourses = async () => {
      try {
        const courses = await getFirebaseCourses();
        if (mounted) {
          setFirebaseCourses(courses);
        }
      } catch (error) {
        console.error('No se pudieron cargar los cursos de Firebase:', error);
      }
    };

    loadFirebaseCourses();

    return () => {
      mounted = false;
    };
  }, [catalogVersion]);

  const updateParams = (patch: Partial<FiltersState>) => {
    const nextFilters = { ...filters, ...patch };
    const nextParams = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value && value !== DEFAULT_FILTERS[key as keyof FiltersState]) {
        nextParams.set(key, value);
      }
    });

    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setSearchQuery(filters.q);
    updateParams({ category: '', level: '', duration: '', pricing: '', sort: 'relevance' });
  };

  const handleSearch = () => {
    updateParams({ q: searchQuery.trim() });
  };

  const filteredCourses = useMemo(() => {
    const filtered = allCourses.filter((course) => {
      const matchesSearch = matchesCourseSearch(course, filters.q);
      const matchesLevel = !filters.level || course.level === filters.level;
      const matchesCategory = !filters.category || course.category === filters.category;
      const matchesPricing = !filters.pricing
        || (filters.pricing === 'Gratis' && !course.isPaid)
        || (filters.pricing === 'Pago' && course.isPaid);

      const matchesDuration = !filters.duration || (() => {
        const duration = parseDurationToMinutes(course.duration);
        switch (filters.duration) {
          case 'short': return duration <= 15;
          case 'medium': return duration > 15 && duration <= 30;
          case 'long': return duration > 30;
          default: return true;
        }
      })();

      return matchesSearch && matchesLevel && matchesCategory && matchesPricing && matchesDuration;
    });

    return sortCourses(filtered, filters.sort);
  }, [allCourses, filters]);

  const activeFilterEntries = [
    ['category', filters.category],
    ['level', filters.level],
    ['duration', durationOptions.find((option) => option.value === filters.duration)?.label || ''],
    ['pricing', filters.pricing],
  ].filter(([, value]) => Boolean(value));

  const activeFiltersCount = activeFilterEntries.length;

  const renderFilterGroup = ({
    title,
    options,
    selectedValue,
    param,
  }: {
    title: string;
    options: readonly string[] | { value: string; label: string }[];
    selectedValue: string;
    param: keyof FiltersState;
  }) => (
    <div className="mb-6">
      <h3 className="font-medium mb-3 text-gray-900">{title}</h3>
      <div className="space-y-2">
        {options.map((item) => {
          const value = typeof item === 'string' ? item : item.value;
          const label = typeof item === 'string' ? item : item.label;
          return (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={param}
                checked={selectedValue === value}
                onChange={() => updateParams({ [param]: selectedValue === value ? '' : value } as Partial<FiltersState>)}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-700">{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        showSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl p-6 border border-gray-200 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-lg">Filtros</h2>
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="text-sm text-purple-600 hover:text-purple-700">
                    Limpiar
                  </button>
                )}
              </div>

              {renderFilterGroup({ title: 'Nivel', options: levelOptions, selectedValue: filters.level, param: 'level' })}
              {renderFilterGroup({ title: 'Duración', options: durationOptions as unknown as { value: string; label: string }[], selectedValue: filters.duration, param: 'duration' })}
              {renderFilterGroup({ title: 'Categoría', options: availableCategories, selectedValue: filters.category, param: 'category' })}
              {renderFilterGroup({ title: 'Precio', options: [...pricingOptions], selectedValue: filters.pricing, param: 'pricing' })}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="lg:hidden mb-6 flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <select
                value={filters.sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {filters.q ? `Resultados para “${filters.q}”` : filters.category ? `Cursos de ${filters.category}` : 'Todos los cursos'}
                </h1>
                <p className="text-gray-600">
                  {filteredCourses.length} {filteredCourses.length === 1 ? 'curso encontrado' : 'cursos encontrados'}
                </p>
              </div>

              <div className="hidden lg:block">
                <label htmlFor="desktop-sort" className="sr-only">Ordenar cursos</label>
                <select
                  id="desktop-sort"
                  value={filters.sort}
                  onChange={(e) => updateParams({ sort: e.target.value })}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {activeFilterEntries.map(([param, value]) => (
                  <button
                    key={param}
                    type="button"
                    onClick={() => updateParams({ [param]: '' } as Partial<FiltersState>)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700"
                  >
                    <span>{value}</span>
                    <X className="w-4 h-4" />
                  </button>
                ))}
              </div>
            )}

            {filteredCourses.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchX className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron cursos</h3>
                <p className="text-gray-600 mb-6">Prueba otra búsqueda, cambia el orden o publica un curso nuevo.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={clearFilters} className="px-5 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50">
                    Limpiar filtros
                  </button>
                  <Link to="/create" className="px-5 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700">
                    Crear un curso
                  </Link>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {filtersOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50">
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg">Filtros</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros">
                <X className="w-6 h-6" />
              </button>
            </div>

            {renderFilterGroup({ title: 'Nivel', options: levelOptions, selectedValue: filters.level, param: 'level' })}
            {renderFilterGroup({ title: 'Duración', options: durationOptions as unknown as { value: string; label: string }[], selectedValue: filters.duration, param: 'duration' })}
            {renderFilterGroup({ title: 'Categoría', options: availableCategories, selectedValue: filters.category, param: 'category' })}
            {renderFilterGroup({ title: 'Precio', options: [...pricingOptions], selectedValue: filters.pricing, param: 'pricing' })}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-700"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
