import React from 'react';
import styled from 'styled-components';

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
  return (
    <Container>
      <Box>
        <Title>Email Verified</Title>
        <Message>Your email has been successfully verified. You can now enjoy all features of the app.</Message>
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