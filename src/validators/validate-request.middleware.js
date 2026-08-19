const { HTTP_STATUS } = require('../constants/http-status');
const { ApiError } = require('../utils/api-error');

function validate(schema, location) {
  return (req, _res, next) => {
    const result = schema.safeParse(req[location]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || location,
        message: issue.message,
      }));

      return next(new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Validation failed.', details));
    }

    req.validated = { ...req.validated, [location]: result.data };
    if (location !== 'query') {
      req[location] = result.data;
    }
    return next();
  };
}

const validateBody = (schema) => validate(schema, 'body');
const validateParams = (schema) => validate(schema, 'params');
const validateQuery = (schema) => validate(schema, 'query');

module.exports = { validateBody, validateParams, validateQuery };
