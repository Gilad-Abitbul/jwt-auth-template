import { Form, Button } from 'react-bootstrap';
import { useState } from 'react';

interface Props {
  onSwitch: () => void;
}

export default function SignupForm({ onSwitch }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ firstName, lastName, email, password });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <h2>הרשמה</h2>
      <Form.Group className="mb-3">
        <Form.Label>שם פרטי</Form.Label>
        <Form.Control value={firstName} onChange={e => setFirstName(e.target.value)} required />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>שם משפחה</Form.Label>
        <Form.Control value={lastName} onChange={e => setLastName(e.target.value)} required />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>אימייל</Form.Label>
        <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>סיסמה</Form.Label>
        <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required />
      </Form.Group>

      <Button type="submit" variant="success" className="w-100">הירשם</Button>

      <div className="mt-3 text-center">
        כבר יש לך חשבון? <Button variant="link" onClick={onSwitch}>להתחברות</Button>
      </div>
    </Form>
  );
}