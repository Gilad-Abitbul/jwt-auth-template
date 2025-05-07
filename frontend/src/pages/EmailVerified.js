import React, { useState } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const Container = styled.div`
  font-family: Arial, sans-serif;
  background-color: #f4f4f4;
  min-height: 100vh;
  padding: 20px;
  color: #333;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Box = styled.div`
  max-width: 600px;
  background-color: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  text-align: center;
`;

const Title = styled.h1`
  color: #007acc;
`;

const Message = styled.p`
  font-size: 18px;
  margin: 20px 0;
`;

const Input = styled.input`
  padding: 10px;
  width: 100%;
  margin-top: 20px;
  font-size: 16px;
`;

const Button = styled.button`
  background-color: #007acc;
  color: white;
  border: none;
  margin-top: 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;

  &:hover {
    background-color: #005fa3;
  }
`;
const Link = styled.a`
  color: #007acc;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const Footer = styled.div`
  margin-top: 30px;
  font-size: 14px;
  color: #666;
`;

const FooterLink = styled.a`
  color: #007acc;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const EmailVerified = () => {
  const query = new URLSearchParams(useLocation().search);
  const status = query.get("status");
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const resendVerification = async () => {
    try {
      await axios.post('http://localhost:4000/api/auth/resend-verification', { email }); // שנה לפי ה-URL שלך
      setMessage('Verification email sent successfully!');
    } catch (error) {
      setMessage('Failed to send verification email. Please try again.');
    }
  };

  return (
    <Container>
      <Box>
        {status === "success" ? (
          <>
            <Title>Email Verified</Title>
            <Message>Your email has been successfully verified. You can now enjoy all features of the app.</Message>
            <Link href='/'>Continue to the app</Link>

          </>
        ) : (
          <>
            <Title>Email Verification Failed</Title>
            <Message>We couldn't verify your email. Please enter your email to resend the verification link.</Message>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Button onClick={resendVerification}>Resend Verification</Button>
            {message && <Message>{message}</Message>}
          </>
        )}
        <Footer>
          <p>Developed by <strong>Gilad Abitbul</strong></p>
          <p>
            <FooterLink href="https://github.com/Gilad-Abitbul" target="_blank">GitHub</FooterLink> |{" "}
            <FooterLink href="https://linkedin.com/in/gilad-abitbul" target="_blank">LinkedIn</FooterLink> |{" "}
            <FooterLink href="mailto:abutbulgilad@gmail.com">abutbulgilad@gmail.com</FooterLink>
          </p>
        </Footer>
      </Box>
    </Container>
  );
};

export default EmailVerified;