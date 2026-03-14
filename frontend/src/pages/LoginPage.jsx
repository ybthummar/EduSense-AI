import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignInCard2 } from '../components/ui/sign-in-card-2';

export default function LoginPage() {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <SignInCard2 />;
}
