import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { HttpError } from './errorHandler.js';

const JWT_SECRET = 'super-secret-key-change-later';
const JWT_EXPIRES_IN = '7d';

export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'No token provided or invalid format');
    }

    const token = authHeader.split(' ')[1];

    const payload = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new HttpError(401, 'User not found');
    }

    req.user = user;

    next();
  } catch (err) {
    next(new HttpError(401, 'Invalid token'));
  }
}

export function signToken(user) {
  const token = jwt.sign({ sub: user.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  return token;
}
