import { Question } from '../models/Question.js';
import { User } from '../models/User.js';

export async function listGlobalFeed(req, res, next) {
  const { tag, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const query = {
    status: 'answered',
    visibility: 'public',
  };

  if (tag) {
    const userIds = await User.find({ tags: tag }).distinct('_id');

    if (!userIds.length) {
      return res.json({
        data: [],
        page: +page,
        limit: +limit,
        total: 0,
        totalPages: 0,
      });
    }

    query.recipient = {
      $in: userIds,
    };
  }

  const questions = await Question.find(query)
    .populate('recipient', 'username displayName avatarUrl tags')
    .sort({ answeredAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Question.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  res.json({
    data: questions,
    page: +page,
    limit: +limit,
    total,
    totalPages,
  });
}
