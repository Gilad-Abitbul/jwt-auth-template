import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login'); // אם אין Token, נעבור לדף ההתחברות
    } else {
      setAuthenticated(true);
    }
  }, [navigate]);

  return (
    <div>
      <h1>Welcome to My React Frontend</h1>
      {authenticated && <p>You are logged in!</p>}
    </div>
  );
}

export default HomePage;
