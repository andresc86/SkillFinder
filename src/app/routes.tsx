import { createBrowserRouter } from 'react-router';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import CourseDetail from './pages/CourseDetail';
import UserProfile from './pages/UserProfile';
import CreateCourse from './pages/CreateCourse';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/search',
    element: <SearchResults />,
  },
  {
    path: '/course/:id',
    element: <CourseDetail />,
  },
  {
    path: '/profile',
    element: <UserProfile />,
  },
  {
    path: '/create',
    element: <CreateCourse />,
  },
]);
