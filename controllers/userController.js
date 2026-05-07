import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';

export async function getPublicProfile(req, res, next) {
  const { username } = req.params;

  const user = await User.findOne({ username }).select(
    'username displayName bio avatarUrl acceptingQuestions tags',
  );
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  res.status(200).json(user);
}

export async function updateMe(req, res, next) {
  const { displayName, bio, avatarUrl, acceptingQuestions, tags } = req.body;
  const userId = req.user._id;
  req.body.username && delete req.body.username;
  req.body.email && delete req.body.email;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { displayName, bio, avatarUrl, acceptingQuestions, tags },
    { new: true, runValidators: true },
  );

  if (!updatedUser) {
    throw new HttpError(404, 'User not found');
  }

  res.status(200).json(updatedUser);
}
