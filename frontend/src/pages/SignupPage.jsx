import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignUpCard } from '../components/ui/sign-up-card';

export default function SignupPage() {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <SignUpCard />;
}
