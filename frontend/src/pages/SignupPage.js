import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState([]);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/api/v1/signup', { firstName, lastName, email, password });
      if (response.status === 201) {
        navigate('/login'); // אחרי הרשמה מוצלחת, לעבור לדף התחברות
      }
    } catch (err) {
      setErrors(err.response?.data?.errors || ['Registration failed']);
    }
  };

  return (
    <div>
      <h1>Signup for an Account</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Signup</button>
      </form>
      {errors.length > 0 && <ul>{errors.map((err, idx) => <li key={idx}>{err}</li>)}</ul>}
    </div>
  );
}

export default SignupPage;
