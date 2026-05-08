import mongoose from 'mongoose';
import { HttpError } from '../middleware/errorHandler.js';
import { Question } from '../models/Question.js';
import { User } from '../models/User.js';

export async function sendQuestion(req, res, next) {
  const { username } = req.params;
  const { body } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (!user.acceptingQuestions) {
    throw new HttpError(403, 'User is not accepting questions');
  }

  if (typeof body !== 'string' || body.trim().length === 0) {
    throw new HttpError(400, 'Body is required');
  }
  if (body.length > 500) {
    throw new HttpError(400, 'Body too long');
  }

  const question = new Question({
    recipient: user._id,
    body,
  });

  await question.save();

  res.status(201).json({
    id: question._id,
    body: question.body,
    status: question.status,
    answer: question.answer,
    createdAt: question.createdAt,
  });
}

export async function listInbox(req, res, next) {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  const status = ['pending', 'answered', 'ignored'];
  const statusFilter = req.query.status;

  if (page < 1 || limit < 1 || limit > 50) {
    throw new HttpError(400, 'Invalid page or limit');
  }
  const skip = (page - 1) * limit;

  const query = {
    recipient: userId,
  };

  if (statusFilter) {
    if (!status.includes(statusFilter)) {
      throw new HttpError(400, 'Invalid status filter');
    }

    query.status = statusFilter;
  }

  const questions = await Question.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Question.countDocuments(query);

  res.json({
    data: questions,
    page: +page,
    limit: +limit,
    total: totalCount,
    totalPages: Math.ceil(totalCount / limit),
  });
}

async function getOwnedQuestion(id, userId) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new HttpError(404, 'Id is not valid');
  }

  const question = await Question.findById(id);

  if (!question) {
    throw new HttpError(404, 'Question not found');
  }

  if (String(question.recipient) !== String(userId)) {
    throw new HttpError(403, 'Not authorized to access this question');
  }

  return question;
}

export async function answerQuestion(req, res, next) {
  const { id } = req.params;
  const { answer, visibility } = req.body;
  const userId = req.user._id;

  const question = await getOwnedQuestion(id, userId);

  question.answer = answer;
  question.answeredAt = new Date();
  question.status = 'answered';

  if (visibility) {
    question.visibility = visibility;
  }

  await question.save();

  res.status(200).json(question);
}

export async function updateQuestion(req, res, next) {
  const { id } = req.params;
  const userId = req.user._id;
  const question = await getOwnedQuestion(id, userId);
  const { answer, status, visibility } = req.body;

  if (answer) {
    question.answer = answer;
    question.answeredAt = new Date();
    question.status = 'answered';
  }

  if (status) {
    question.status = status;
  }
  if (visibility) {
    question.visibility = visibility;
  }

  await question.save();

  res.status(200).json(question);
}

export async function removeQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const question = await getOwnedQuestion(id, userId);

    await Question.findByIdAndDelete(id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listPublicFeed(req, res, next) {
  const { username } = req.params;

  const user = await User.findOne({ username });
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const { page = 1, limit = 10 } = req.query;

  const pageNum = +page;
  const limitNum = +limit;

  if (pageNum < 1 || limitNum < 1) {
    throw new HttpError(400, 'Invalid page or limit');
  }
  const skip = (pageNum - 1) * limitNum;

  const query = {
    recipient: user._id,
    status: 'answered',
    visibility: 'public',
  };

  const questions = await Question.find(query)
    .sort({ answeredAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Question.countDocuments(query);

  res.json({
    data: questions,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
}
