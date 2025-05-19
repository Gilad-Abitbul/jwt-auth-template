import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Container, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';


export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const encoded = searchParams.get('e');
  const email = encoded ? decodeEmail(encoded) : null;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function decodeEmail(encoded: string): string | null {
    try {
      const padLength = (4 - (encoded.length % 4)) % 4;
      const padded = encoded + '='.repeat(padLength);
      const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
      return atob(base64);
    } catch {
      return null;
    }
  }
  const handleResend = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await axios.post('http://localhost:8080/api/v1/resend-verification', { email });
      setMessage('Verification email sent again. Please check your inbox.');
    } catch (err: any) {
      setError('An error occurred while sending the verification email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5" style={{ maxWidth: '500px' }}>
      <h3 className="mb-3">Email Verification</h3>

      {email ? (
        <>
          <p>
            The email address <strong>{email}</strong> has not been verified yet. To continue using the system, please verify your email.
          </p>

          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <Button onClick={handleResend} disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : 'Resend Verification Email'}
          </Button>
        </>
      ) : (
        <Alert variant="warning">No email address found. Please return to the login page.</Alert>
      )}
    </Container>
  );
}