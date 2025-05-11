// LoginPage.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
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

const OTPInputWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
`;

const OTPBox = styled.input`
  width: 40px;
  height: 45px;
  text-align: center;
  font-size: 20px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 6px;
`;

function LoginPage({ toggleTheme, isDarkMode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showReset, setShowReset] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  // const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState({
    otpSentCooldown: 0,
    otpVerifyCooldown: 0,
  });
  const [resetFlow, setResetFlow] = useState({
    otpSent: false,
    otpVerified: false,
    resetToken: '',
    otp: ['', '', '', '', '', ''],
  });

  useEffect(() => {
    let otpSentTimer;
    if (cooldown.otpSentCooldown > 0) {
      otpSentTimer = setInterval(() => {
        setCooldown((prev) => {
          return {...prev, otpSentCooldown: prev.otpSentCooldown - 1}
        });
      }, 1000);
    }
    return () => clearInterval(otpSentTimer);
  }, [cooldown]);

  const navigate = useNavigate();
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? [] : ['Please enter a valid email address.'];
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
    if (!/[^A-Za-z0-9]/.test(value))
      errors.push('Password must contain at least one special character.');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await axios.post('http://localhost:8080/api/v1/login', { email, password });
      if (res.status === 200) {
        localStorage.setItem('token', res.data.token);
        navigate('/home');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError(err.response?.data?.message);
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message);
        const emailError = err.response?.data?.details.email;
        const passwordError = err.response?.data?.details.password;
        setFieldErrors((prev) => {
          return { ...prev, email: emailError, password: passwordError };
        });
      } else {
        setError(err.response?.data?.message ? err.response?.data?.message :'Server error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  const formatRetryTime = (totalSeconds) => {
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
  
    const parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
  
    return parts.join(', ');
  };
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8080/api/v1/reset-password', {newPassword, resetToken: resetFlow.resetToken})
      if (res.status === 200) {
        setResetFlow({
          otpSent: false,
          otpVerified: false,
          resetToken: '',
          otp: ['', '', '', '', '', ''],
        });
        setPassword(newPassword);
        setNewPassword('');
        setError(null);
        setShowReset(false);
      }
    } catch (err) {
      setError('Server Error. Try again later');
    }
  }
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:8080/api/v1/request-password-reset-otp', { email });
      if (res.status === 200) {
        setResetFlow((prev) => {
          return { ...prev, otpSent: true }
        });
        setError(res.data.message);
        // setOtpSent(true);
      }
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfterSeconds = err.response?.data?.retryAfterSeconds;
        if(retryAfterSeconds) {
          setCooldown((prev) => {
            return { ...prev, otpSentCooldown: retryAfterSeconds }
          });
        }
        const formattedTime = formatRetryTime(retryAfterSeconds);

        setError(`Too many requests. Try again in ${formattedTime}.`);
      } else if(err.response?.status === 400) {
        setError(err.response?.data?.message);
        setFieldErrors((prev)=> {
          return { ...prev, email: err.response?.data?.details?.email }
        })
      } else {
        setError('Server Error - Failed to send OTP. Try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const resetotp = resetFlow.otp.join('');
      const res = await axios.post('http://localhost:8080/api/v1/verify-password-reset-otp', { email, otp: resetotp });
      if (res.status === 200) {
        setResetFlow((prev) => {
          return { ...prev, otpVerified: true,  resetToken: res.data.resetToken}
        });
        // setOtpVerified(true);
        // setResetToken(res.data.resetToken);
      }
    } catch (err) {
      setError('Failed to send OTP. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...resetFlow.otp];
    updated[index] = value;
    setResetFlow((prev)=> {
      return { ...prev, otp: updated }
    })
    // setOtp(updated);
    if (value && index < resetFlow.otp.length - 1) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  return (
    <Container>
      <FormWrapper>
        <ThemeIcon onClick={toggleTheme}>
          {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
        </ThemeIcon>
        <Title>{showReset ? 'Reset Password' : 'Login'}</Title>
        {!showReset ? (
         <>
         {error && <div><ErrorText>{error}</ErrorText></div>}
         <form onSubmit={handleSubmit}>
           <Input
           type="email"
           placeholder="Email"
           value={email}
           onChange={(event) => {
             setEmail(event.target.value);
             setFieldErrors((prev) => ({...prev, email: []}));
           }}
           onBlur={() => {
             const errors = validateEmail(email);
             setFieldErrors((prev) => ({...prev, email: errors}));
           }}
           required
           />
           {fieldErrors.email?.map((msg, i) => <ValidationErrorsText key={i}>{msg}</ValidationErrorsText>)}
           <Input
           type="password"
           placeholder="Password"
           value={password}
           onChange={(event) => {
             setPassword(event.target.value);
             setFieldErrors((prev) => ({...prev, password: []}));
           }}
           onBlur={() => {
             const errors = validatePassword(password);
             setFieldErrors((prev) => ({...prev, password: errors}));
           }}
           required
           />
           {fieldErrors.password?.map((msg, i) => <ValidationErrorsText key={i}>{msg}</ValidationErrorsText>)}
           <label style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Remember me
          </label>
           <Button
               type="submit"
               disabled={isLoading}
               >
               {isLoading ? 'Logging In...' : 'Login'}
               </Button>
         </form>
                  <p style={{ marginTop: '10px', textAlign: 'center' }}>
                  {!showReset && (
                    <>Don't have an account? <Link to="/signup">Sign up</Link></>
                  )}
                </p>
                <p style={{ textAlign: 'center', marginTop: '5px', cursor: 'pointer' }}>
            <span onClick={() => setShowReset(true)}>Forgot your password?</span>
        </p>
                </>
        ) : (
         <>
           {!resetFlow.otpSent && (
            <>
             {error && <div><ErrorText>{error}</ErrorText></div>}
             <form onSubmit={handleSendOtp}>
               <Input
               type="email"
               placeholder="Email"
               value={email}
               onChange={(event) => {
                 setEmail(event.target.value);
                 setFieldErrors((prev) => ({...prev, email: []}));
               }}
               onBlur={() => {
                 const errors = validateEmail(email);
                 setFieldErrors((prev) => ({...prev, email: errors}));
               }}
               required
               />
               {fieldErrors.email?.map((msg, i) => <ValidationErrorsText key={i}>{msg}</ValidationErrorsText>)}
               <Button
               type="submit"
               disabled={isLoading || cooldown.otpSentCooldown > 0}
               >
                {cooldown.otpSentCooldown > 0 ? `Send OTP again in ${cooldown.otpSentCooldown} Sec` : isLoading ? 'Sending OTP...' : 'Send OTP'}
               </Button>
             </form>
             </>
           )}
           {resetFlow.otpSent && !resetFlow.otpVerified &&(
            <>
              {error && <div><ErrorText>{error}</ErrorText></div>}
             <form onSubmit={handleVerifyOtp}>
             <OTPInputWrapper>
             {resetFlow.otp.map((value, i) => (
               <OTPBox
                 key={i}
                 id={`otp-${i}`}
                 type="text"
                 maxLength={1}
                 value={value}
                 onChange={(e) => handleOtpChange(i, e.target.value)}
               />
             ))}
           </OTPInputWrapper>
           <Button
               type="submit"
               disabled={isLoading}
               >
               {isLoading ? 'Verifying...' : 'Verify OTP'}
               </Button>
             </form>
             </>
           )}
           {resetFlow.otpSent && resetFlow.otpVerified && (
             <form onSubmit={handleResetPassword}>
             <Input
             type="password"
             placeholder="New Password"
             value={newPassword}
             onChange={(e) => {
               setNewPassword(e.target.value);
               setFieldErrors((prev) => ({ ...prev, newPassword: [] }));
             }}
             onBlur={() => {
               const errors = validatePassword(newPassword);
               setFieldErrors((prev) => ({ ...prev, newPassword: errors }));
             }}
             required
             />
              <Button
               type="submit"
               disabled={isLoading}
               >
               {isLoading ? 'Setting Password...' : 'Set New Password'}
               </Button>
             </form>
           )}
           <p style={{ textAlign: 'center', marginTop: '5px', cursor: 'pointer' }}>
            <span onClick={() => setShowReset(false)}>Back to login</span>
           </p>
           </>
        )}
      </FormWrapper>
    </Container>
  );
}

export default LoginPage;