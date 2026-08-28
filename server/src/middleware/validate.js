/**
 * Validation middleware factory.
 * Compatible with Zod v4 (uses .issues) and Zod v3 (uses .error.errors).
 *
 * Usage: router.post('/route', validate(mySchema), controller)
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    // Zod v4 uses result.error.issues; Zod v3 used result.error.errors
    const rawIssues = result.error?.issues ?? result.error?.errors ?? [];
    const errors = rawIssues.map((e) => ({
      field:   Array.isArray(e.path) ? e.path.join('.') : String(e.path ?? ''),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: errors[0]?.message || 'Validation failed',
      errors,
    });
  }
  req.body = result.data;
  next();
};

/**
 * Query-param validation middleware factory.
 * Usage: router.get('/export', protect, validateQuery(exportSchema), handler)
 */
const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const rawIssues = result.error?.issues ?? result.error?.errors ?? [];
    const errors = rawIssues.map((e) => ({
      field:   Array.isArray(e.path) ? e.path.join('.') : String(e.path ?? ''),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Invalid query parameters',
      errors,
    });
  }
  req.query = result.data;
  next();
};

module.exports = { validate, validateQuery };
