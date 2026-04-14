import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

export async function signup(req, res, next) {
  try {
    const { username, email, password, displayName } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new HttpError(409, 'Username or Email already exists');
    }

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      username,
      email,
      passwordHash,
      displayName,
    });

    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === 11000) {
      return next(new HttpError(409, 'Username or Email already exists'));
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const token = signToken(user);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json(req.user);
}
