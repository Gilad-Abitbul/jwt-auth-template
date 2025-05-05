const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in environment variables');
}

export const config = {
  bcryptSaltRounds: BCRYPT_SALT_ROUNDS,
  jwtSecret: JWT_SECRET,
  jwtExpiresIn: '1h',
  backendDomain: process.env.BACKEND_DOMAIN!,
};