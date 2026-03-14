python -c "
import sys
with open('frontend/src/pages/LoginPage.jsx', 'r', encoding='utf-8') as f:
    t = f.read()

t = t.replace('import { Navigate } from \'react-router-dom\';', 'import { Navigate, useNavigate } from \'react-router-dom\';\nimport { useState } from \'react\';')
t = t.replace('const { user } = useAuth();', '''const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);''')

with open('frontend/src/pages/LoginPage.jsx', 'w', encoding='utf-8') as f:
    f.write(t)
"
