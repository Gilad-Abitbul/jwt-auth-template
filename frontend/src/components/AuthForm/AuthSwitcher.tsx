import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { Card, Container } from 'react-bootstrap';

export default function AuthSwitcher() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh' }}
    >
      <Card className="shadow-lg border-0 rounded-4 p-4" style={{ maxWidth: '420px', width: '100%' }}>      <Card.Body>
        {isLogin
          ? <LoginForm onSwitch={() => setIsLogin(false)} />
          : <SignupForm onSwitch={() => setIsLogin(true)} />}
      </Card.Body>
      </Card>
    </Container>
  );
}