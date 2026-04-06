import { Link } from 'react-router';
import { Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CategoryCard } from '../components/CategoryCard';
import { categories } from '../data/mockData';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        {/* Logo and Title */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl">
            <Search className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-5xl sm:text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            SkillFinder
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Descubre y aprende habilidades prácticas para tu día a día
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-8">
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="¿Qué quieres aprender hoy?"
              className="w-full px-6 py-5 pl-14 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all shadow-sm group-hover:shadow-md"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl transition-colors font-medium"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Quick suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="text-sm text-gray-500">Sugerencias:</span>
          {['doblar ropa', 'cocinar arroz', 'organizar tiempo'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setSearchQuery(suggestion);
                navigate(`/search?q=${encodeURIComponent(suggestion)}`);
              }}
              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-purple-300 hover:text-purple-600 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Categorías destacadas
          </h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              {...category}
            />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">¿Tienes una habilidad que compartir?</h2>
          <p className="text-lg text-purple-100 mb-6">
            Únete a nuestra comunidad y ayuda a otros a aprender
          </p>
          <Link
            to="/create"
            className="inline-block bg-white text-purple-600 px-8 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            Crear tu primer curso
          </Link>
        </div>
      </div>
    </div>
  );
}
