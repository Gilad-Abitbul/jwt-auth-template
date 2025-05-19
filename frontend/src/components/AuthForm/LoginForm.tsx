import { Form, Button, FormControl } from 'react-bootstrap';
import { useRef, useState } from 'react';
import { z } from 'zod';
import axios, { AxiosError } from 'axios';
import { env } from '../../env';
import CountdownButton from '../CountdownButton';
import { useNavigate } from 'react-router-dom';
import { IoReturnUpBack } from "react-icons/io5";

const loginUserSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(5, { message: 'Password must be at least 5 characters long.' })
    .max(12, { message: 'Password must be between 5 and 12 characters long.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character (e.g. @, #, $).' })
    .refine(val => !val.includes(' '), 'Password must not contain spaces.'),
  rememberMe: z.boolean().default(false),
});

const OtpRequestSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address.' })
    .transform((val) => val.trim().toLowerCase()),
});

type LoginUserInput = z.infer<typeof loginUserSchema>;
type OtpRequestInput = z.infer<typeof OtpRequestSchema>;

interface Props {
  onSwitch: () => void;
}



export default function LoginForm({ onSwitch }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [loginInfo, setLoginInfo] = useState('');
  const [loginInputError, setLoginInputError] = useState<Partial<Record<keyof LoginUserInput, string[]>>>({});
  const [email, setEmail] = useState('abutbulgilad@gmail.com');
  const passwordRef = useRef<HTMLInputElement>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginTimeout, setLoginTimeout] = useState(0);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [forgotPasswordInfo, setForgotPasswordInfo] = useState('');

  const [otpSent, setOtpSent] = useState(false);
  const [otpRequestInputError, setOtpRequestInputError] = useState<Partial<Record<keyof OtpRequestInput, string[]>>>({});
  const [otpRequestTimeout, setOtpRequestTimeout] = useState(0);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const password = passwordRef.current?.value || '';

    const parseResult = loginUserSchema.safeParse({ email, password, rememberMe });
    if (!parseResult.success) {
      const fieldErrors: Partial<Record<keyof LoginUserInput, string[]>> = {};
      for (const issue of parseResult.error.issues) {
        const fieldName = issue.path[0] as keyof LoginUserInput;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = [];
        }
        fieldErrors[fieldName]!.push(issue.message);
      }
      setLoginInputError(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      setLoginInputError({});
      setLoginInfo('');
      setLoginTimeout(0);

      const response = await axios.post(`${env.backendDomain}/api/v1/login`, {
        email: parseResult.data.email,
        password: parseResult.data.password,
        rememberMe: parseResult.data.rememberMe,
      });

      if (response.status === 200) console.log('Login successful!');

    } catch (err) {

      const error = err as AxiosError<any>;

      if (!error.response) {
        setLoginInfo('Network error or server is down.')
        return;
      }

      const { status, data } = error.response;

      switch (status) {

        // Server Validation Error:
        case 400:
          if (data?.details) {
            const serverValidationErrors: Partial<Record<keyof LoginUserInput, string[]>> = {};
            for (const key in data.details) {
              if (data.details[key]?.[0]) {
                serverValidationErrors[key as keyof LoginUserInput] = data.details[key];
              }
            }
            setLoginInputError(serverValidationErrors);
          } else {
            setLoginInputError({ email: ['Invalid Input'], password: ['Invalid Input'] })
          }
          break;

        // Authentication Error:
        case 401:
          setLoginInfo('Email and password do not match');
          break;

        // User Email Address Not Verified:
        case 403:
          const email = parseResult.data.email;
          navigate(`/verify-email?e=${btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`);
          break;

        // Limiter Error:
        case 429:
          if (data?.message) {
            setLoginInfo(data.message)
          } else {
            setLoginInfo('Too many requests! Try again later.')
          }
          if (data?.meta?.retryAfterSeconds) {
            setLoginTimeout(data.meta.retryAfterSeconds);
          } else {
            setLoginTimeout(10800);
          }
          break;

        // Server Error:
        default:
          setLoginInfo('An unexpected error occurred. Please try again later.')
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const parseResult = OtpRequestSchema.safeParse({ email });

    if (!parseResult.success) {
      const fieldErrors: Partial<Record<keyof OtpRequestInput, string[]>> = {};

      for (const issue of parseResult.error.issues) {
        const fieldName = issue.path[0] as keyof OtpRequestInput;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = [issue.message];
        }
      }
      setOtpRequestInputError(fieldErrors);
      return;

    } else {
      setIsLoading(true);
      try {
        setOtpRequestTimeout(0);
        setOtpRequestInputError({});
        setForgotPasswordInfo('');

        const response = await axios.post(`${env.backendDomain}/api/v1/request-password-reset-otp`, {
          email: parseResult.data.email,
        });

        if (response.status === 200) {
          if (response.data?.message) {
            setOtpSent(true);
            setForgotPasswordInfo(`A 6-digit OTP has been sent to the email address: ${email}.`);
            setOtpRequestTimeout(60);
          }
        };
      } catch (err) {
        const error = err as AxiosError<any>;

        if (!error.response) {
          setForgotPasswordInfo('Network error or server is down.')
          return;
        }

        const { status, data } = error.response;

        switch (status) {

          // Server Validation Error:
          case 400:
            if (data?.details) {
              const serverValidationErrors: Partial<Record<keyof OtpRequestInput, string[]>> = {};
              for (const key in data.details) {
                if (data.details[key]?.[0]) {
                  serverValidationErrors[key as keyof OtpRequestInput] = data.details[key];
                }
              }
              setOtpRequestInputError(serverValidationErrors);
            } else {
              setOtpRequestInputError({ email: ['Invalid email'] })
            }
            break;

          // Limiter Error:
          case 429:
            if (data?.message) {
              setForgotPasswordInfo(data.message)
            } else {
              setForgotPasswordInfo('Too many requests! Try again later.')
            }
            if (data?.meta?.retryAfterSeconds) {
              setOtpRequestTimeout(data.meta.retryAfterSeconds);
            } else {
              setOtpRequestTimeout(600);
            }
            break;

          default:
            setForgotPasswordInfo('An unexpected error occurred. Please try again later.')
            break;
        }

      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullOtp = otp.join('');
    console.log(fullOtp);

  }

  if (isForgotPassword && otpSent) {
    return (
      <>
        <Button
          variant="link"
          className="d-inline-flex align-items-center text-decoration-none text-dark"
          onClick={() => {
            setOtpSent(false);
            setForgotPasswordInfo('');
            setOtp(['', '', '', '', '', '']);
          }}
          style={{ gap: '0.5rem' }}
        >
          <IoReturnUpBack size={25} />
          <span className="fw-semibold">Back</span>
        </Button>

        <h1 className="text-center mb-4 display-5">Forgot Password</h1>
        <h3 className="text-center mb-4">OTP Verification</h3>
        <p className="text-center mt-3">
          An OTP code has been sent to <strong>{email}</strong>.
          <br />
          Didn’t receive the code? You can request a new one below.
        </p>
        <Form onSubmit={handleVerifyOtp} noValidate className="d-flex flex-column align-items-center">

          {forgotPasswordInfo && (
            <div className="text-danger mb-3">{forgotPasswordInfo}</div>
          )}

          <Form.Group className="d-flex justify-content-center gap-3 mb-4">
            {otp.map((digit, index) => (
              <Form.Control
                key={index}
                type="text"
                maxLength={1}
                id={`otp-${index}`}
                value={digit}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!/^[0-9]?$/.test(val)) return;
                  const newOtp = [...otp];
                  newOtp[index] = val;
                  setOtp(newOtp);
                  if (val && index < otp.length - 1) {
                    document.getElementById(`otp-${index + 1}`)?.focus();
                  } else if (val && index === otp.length - 1) {
                    document.getElementById('btn-verify-otp')?.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !otp[index] && index > 0) {
                    document.getElementById(`otp-${index - 1}`)?.focus();
                  }
                }}
                className={`text-center fs-4 ${otpError ? 'border border-danger' : ''}`}
                style={{
                  width: '3rem',
                  height: '3.5rem',
                  borderRadius: '0.5rem',
                  boxShadow: '0 0 4px rgba(0,0,0,0.1)',
                }}
              />
            ))}
          </Form.Group>

          <div className="d-flex flex-column align-items-center w-100 gap-3">
            <CountdownButton
              countdownSeconds={otpRequestTimeout}
              type="button"
              onClick={() => { handleForgotSubmit() }}
              disabled={isLoading}
              variant="link"
              className="text-decoration-none"
            >
              Resend OTP
            </CountdownButton>
            <CountdownButton
              id="btn-verify-otp"
              type="submit"
              disabled={isLoading}
              className="w-100"
            >
              Verify OTP
            </CountdownButton>
          </div>
        </Form>
      </>
    )
  }
  if (isForgotPassword) {
    return (
      <>
        <h1 className="text-center mb-4">Forgot Password</h1>
        <h3 className="text-center mb-4">OTP verification</h3>
        <Form onSubmit={handleForgotSubmit} noValidate>
          {forgotPasswordInfo && <Form.Text className="text-danger">{forgotPasswordInfo}</Form.Text>}
          <Form.Group className="mb-3" controlId="forgotEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value)
                setOtpRequestInputError(prev => ({ ...prev, email: undefined }));
              }}
              isInvalid={!!otpRequestInputError.email}
              required
            />
            {otpRequestInputError.email?.map((err, index) => (
              <FormControl.Feedback type='invalid' key={index}>{err}</FormControl.Feedback>
            ))}
          </Form.Group>
          <CountdownButton
            type='submit'
            countdownSeconds={otpRequestTimeout}
            className="w-100 mt-2"
            disabled={isLoading}
          >
            Send OTP
          </CountdownButton>

          <div className="mt-3 text-center">
            <Button variant="link" onClick={() => setIsForgotPassword(false)}>
              Back to Login
            </Button>
          </div>
        </Form>
      </>
    );
  }
  return (
    <>
      <h1 className="text-center mb-4">Login</h1>
      <Form onSubmit={handleSubmit} noValidate>
        {loginInfo && <Form.Text className="text-danger">{loginInfo}</Form.Text>}

        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            onChange={(e) => {
              setEmail(e.target.value)
              setLoginInputError(prev => {
                const { email, ...rest } = prev;
                return rest;
              })
            }}
            value={email}
            isInvalid={!!loginInputError.email || loginInfo !== ''}
            required
          />
          {loginInputError.email?.map((err, index) => (
            <FormControl.Feedback type='invalid' key={index}>{err}</FormControl.Feedback>
          ))}
        </Form.Group>

        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            ref={passwordRef}
            onChange={() => {
              setLoginInputError(prev => {
                const { password, ...rest } = prev;
                return rest;
              })
            }}
            // value={password}
            // onChange={e => setPassword(e.target.value)}
            isInvalid={!!loginInputError.password || loginInfo !== ''}
            required
          />
          {loginInputError.password?.map((err, index) => <FormControl.Feedback type='invalid' key={index}>{err}</FormControl.Feedback>)}
        </Form.Group>

        <Form.Group className="mb-3" controlId="rememberMe">
          <Form.Check
            type="checkbox"
            label="Remember me"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
          />
        </Form.Group>

        <CountdownButton
          type='submit'
          className="w-100"
          countdownSeconds={loginTimeout}
          disabled={isLoading}
        >
          Login
        </CountdownButton>

        <div className="mt-3 text-center">
          <Button variant="link" onClick={() => setIsForgotPassword(true)}>
            Forgot Password?
          </Button>
        </div>
        <div className="mt-3 text-center">
          Don't have an account? <Button variant="link" onClick={onSwitch}>Create one</Button>
        </div>
      </Form>
    </>
  );
}