import { useState } from 'react';
import { Link } from 'react-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log("Enviando a:", email);

      await sendPasswordResetEmail(auth, email);

      console.log("Correo enviado correctamente");

      setMessage('Revisa tu correo para cambiar la contraseña.');
      setError('');
    } catch (err: any) {
      console.error("ERROR REAL:", err);

      setError(err.message);
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">
            Recuperar contraseña
          </h2>

          <form onSubmit={handleReset} className="space-y-4">
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium">
              Enviar correo
            </button>
          </form>

          {message && (
            <p className="text-green-600 mt-4 text-center">{message}</p>
          )}

          {error && (
            <p className="text-red-600 mt-4 text-center">{error}</p>
          )}

          <Link
            to="/login"
            className="block mt-6 text-sm text-purple-600 text-center"
          >
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}