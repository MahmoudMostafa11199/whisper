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
};
