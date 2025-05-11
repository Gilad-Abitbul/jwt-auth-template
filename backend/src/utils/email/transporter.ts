import nodemailer from 'nodemailer';
import { env } from '../../env';

export const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: env.emailUser,
    pass: env.emailPass,
  },
});