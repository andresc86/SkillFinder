import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Search, LogIn, CircleAlert } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Completa el correo y la contraseña.');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError('No se pudo iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-xl mb-4">
            <Search className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              SkillFinder
            </span>
          </h1>

          <p className="text-gray-600">Inicia sesión para continuar</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <LogIn className="w-5 h-5 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">Login</h2>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <CircleAlert className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Correo
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-3 rounded-xl font-medium transition-colors"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-purple-600 font-medium hover:text-purple-700">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
