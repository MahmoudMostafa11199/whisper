export const validate = (schema) => (req, res, next) => {
  console.log(req.body);
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      },
    });
  }

  req.body = result.data;

  next();

  // TODO:
  // Hint: schema.safeParse(req.body). On failure: 400 with { error: { message, details } }.
  // On success: replace req.body with result.data and call next().
};
