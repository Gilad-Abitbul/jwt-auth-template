// RegisterPage.js
import { useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { FaSun, FaMoon } from 'react-icons/fa';
import axios from 'axios';

const Container = styled.div`
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.pageBackground};
`;

const ThemeIcon = styled.div`
  text-align: right;
  margin-bottom: 20px;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
`;

const FormWrapper = styled.div`
  background-color: ${({ theme }) => theme.formBackground};
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 0 25px ${({ theme }) => theme.shadowColor};
  width: 100%;
  max-width: 500px;
`;

const Title = styled.h2`
  margin-bottom: 25px;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
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
  margin-top: 10px;
`;

const ValidationErrorsText = styled.p`
  color: red;
  font-size: 14px;
  margin-top: -5px;
  margin-bottom: 10px;
`;

const ErrorText = styled.p`
  color: red;
  font-size: 15px;
  font-weight: bold;
  margin-top: 5px;
  margin-bottom: 10px;
  text-align: center;
`;

function SignupPage({ toggleTheme, isDarkMode }) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({
    firstName: ['First name must be between 3 and 12 characters.'],
    lastName: ['Last name must be between 3 and 12 characters.'],
    email: [],
    password: [
      'Password must be between 5 and 12 characters long.',
      'Password must contain at least one uppercase letter.',
      'Password must contain at least one lowercase letter.',
      'Password must contain at least one number.',
      'Password must contain at least one special character (e.g. @, #, $).',
    ],
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? [] : ['Please enter a valid email address.'];
  };

  const validateName = (value, filedName) => {
    const errors = [];
    if (value.length < 3 || value > 12) 
      errors.push(`${filedName} must be between 3 and 12 characters.`);
    if (/\s/.test(value)) 
      errors.push(`${filedName} must not contain spaces.`);
    return errors;
  };

  
  const validatePassword = (value) => {
    const errors = [];
    if (value.length < 5 || value.length > 12)
      errors.push('Password must be between 5 and 12 characters long.');
    if (/\s/.test(value))
      errors.push('Password must not contain spaces.');
    if (!/[A-Z]/.test(value))
      errors.push('Password must contain at least one uppercase letter.');
    if (!/[a-z]/.test(value))
      errors.push('Password must contain at least one lowercase letter.');
    if (!/[0-9]/.test(value))
      errors.push('Password must contain at least one number.');
    if (!/[^A-Za-z0-9]/.test(value))
      errors.push('Password must contain at least one special character.');
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: [] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErrors = validateEmail(formData.email);
    const passwordErrors = validatePassword(formData.password);
    const firstNameErrors = validateName(formData.firstName, "First name");
    const lastNameErrors = validateName(formData.lastName, "Last name");

    if (
      emailErrors.length || 
      passwordErrors.length || 
      firstNameErrors.length || 
      lastNameErrors.length
    ) {
      setFieldErrors({ 
        email: emailErrors, 
        password: passwordErrors,
        firstName: firstNameErrors,
        lastName: lastNameErrors
      });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:8080/api/v1/signup', formData);
      if (res.status === 201) {
        navigate('/login');
      }
    } catch (err) {
      if (err.response?.status === 422) {
        setError(err.response?.data?.details?.email);
      }
      // setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <FormWrapper>
        <ThemeIcon onClick={toggleTheme}>
          {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
        </ThemeIcon>
        <Title>Register</Title>
        {error && <ErrorText>{error}</ErrorText>}
        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => setFieldErrors((prev) => ({
              ...prev,
              email: validateEmail(formData.email),
            }))}
            required
          />
          {fieldErrors.email?.map((msg, i) => <ValidationErrorsText key={i}>{msg}</ValidationErrorsText>)}

          <Input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            onBlur={() => setFieldErrors((prev) => ({
              ...prev,
              firstName: validateName(formData.lastName, 'First name'),
            }))}
            required
          />
          {fieldErrors.firstName?.map((msg, i) => <ValidationErrorsText key={i}>{msg}</ValidationErrorsText>)}

          <Input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            onBlur={() => setFieldErrors((prev) => ({
              ...prev,
              lastName: validateName(formData.lastName, 'Last name'),
            }))}
            required
          />
          {fieldErrors.lastName?.map((msg, i) => <ValidationErrorsText key={i}>{msg}</ValidationErrorsText>)}
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            onBlur={() => setFieldErrors((prev) => ({
              ...prev,
              password: validatePassword(formData.password),
            }))}
            required
          />
          {fieldErrors.password?.map((msg, i) => <ValidationErrorsText key={i}>{msg}</ValidationErrorsText>)}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register'}
          </Button>
        </form>
        <p style={{ marginTop: '10px', textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </FormWrapper>
    </Container>
  );
}

export default SignupPage;
