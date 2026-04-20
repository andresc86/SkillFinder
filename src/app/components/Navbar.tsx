import { Link } from 'react-router';
import { Search, User, Menu, X, BookOpen, LogIn, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearch?: () => void;
}

export function Navbar({
  showSearch = false,
  searchQuery = '',
  onSearchChange,
  onSearch,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.();
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0"
            aria-label="Ir al inicio de SkillFinder"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              SkillFinder
            </span>
          </Link>

          {showSearch && (
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-2xl mx-2"
              role="search"
            >
              <label htmlFor="navbar-search" className="sr-only">
                Buscar cursos
              </label>
              <div className="relative w-full">
                <input
                  id="navbar-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder="¿Qué quieres aprender hoy?"
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
            </form>
          )}

          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/create"
              className="text-gray-700 hover:text-purple-600 transition-colors flex items-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              <span>Crear curso</span>
            </Link>

            <Link
              to="/profile"
              className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
            >
              <User className="w-5 h-5" />
              <span>Perfil</span>
            </Link>

            <Link
              to="/login"
              className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              <span>Login</span>
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors font-medium"
            >
              <UserPlus className="w-5 h-5" />
              <span>Registro</span>
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {showSearch && (
          <form onSubmit={handleSearchSubmit} className="md:hidden pb-4" role="search">
            <label htmlFor="navbar-search-mobile" className="sr-only">
              Buscar cursos
            </label>
            <div className="relative">
              <input
                id="navbar-search-mobile"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="¿Qué quieres aprender hoy?"
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                aria-hidden="true"
              />
            </div>
          </form>
        )}

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col gap-4">
              <Link
                to="/create"
                className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BookOpen className="w-5 h-5" />
                <span>Crear curso</span>
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="w-5 h-5" />
                <span>Perfil</span>
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </Link>

              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserPlus className="w-5 h-5" />
                <span>Registro</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}