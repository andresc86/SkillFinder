import { createBrowserRouter } from 'react-router';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import CourseDetail from './pages/CourseDetail';
import UserProfile from './pages/UserProfile';
import CreateCourse from './pages/CreateCourse';
import Login from './pages/Login';
import Register from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthRedirect } from './components/AuthRedirect';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
  },
  {
    path: '/search',
    element: (
      <ProtectedRoute>
        <SearchResults />
      </ProtectedRoute>
    ),
  },
  {
    path: '/course/:id',
    element: (
      <ProtectedRoute>
        <CourseDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: '/course/:id/edit',
    element: (
      <ProtectedRoute>
        <CreateCourse />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <UserProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/create',
    element: (
      <ProtectedRoute>
        <CreateCourse />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <AuthRedirect>
        <Login />
      </AuthRedirect>
    ),
  },
  {
    path: '/register',
    element: (
      <AuthRedirect>
        <Register />
      </AuthRedirect>
    ),
  },
]);
