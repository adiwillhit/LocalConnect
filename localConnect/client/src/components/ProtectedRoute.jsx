import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SkeletonCard } from './SkeletonCard';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

