import { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaSun, FaMoon } from 'react-icons/fa';

const Container = styled.div`
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
`;
const ThemeIcon = styled.div`
  margin-top: 15px;
  text-align: center;
  cursor: pointer;
  color: ${({ theme }) => theme.text};

  &:hover {
    opacity: 0.7;
  }
`;
const FormWrapper = styled.div`
  background-color: ${({ theme }) => theme.formBackground};
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0px 0px 50px ${({ theme }) => theme.shadowColor};
  width: min(70%, 400px);
`;

const Title = styled.h2`
  margin-bottom: 20px;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 8px;
  background-color: transparent;
  color: inherit;
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: ${({ theme }) => theme.buttonBackground};
  color: ${({ theme }) => theme.buttonText};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    opacity: 0.5;
  }
`;

const ErrorText = styled.p`
  color: red;
  font-size: 14px;
  margin-top: -10px;
  margin-bottom: 10px;
`;

function LoginPage({ toggleTheme, isDarkMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:8080/api/v1/login', { email, password });
      if (res.status === 200) {
        localStorage.setItem('token', res.data.token);
        window.location.href = '/home';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <Container>
      <FormWrapper>
      <ThemeIcon onClick={toggleTheme}>
          {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
        </ThemeIcon>
        <Title>Login</Title>
        <form onSubmit={handleSubmit}>
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && <ErrorText>{error}</ErrorText>}
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit">Login</Button>
        </form>
        <p style={{ marginTop: '10px', textAlign: 'center' }}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </FormWrapper>
    </Container>
  );
}

export default LoginPage;