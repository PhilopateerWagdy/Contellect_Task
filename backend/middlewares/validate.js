const validate =
  (schema, property = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      console.error(
        "Validation failed:",
        JSON.stringify(result.error, null, 2)
      );
      const errorMessages = result.error.issues.map((issue) => issue.message);
      return res.status(400).json({ errors: errorMessages });
    }

    req[property] = result.data;

    next();
  };

module.exports = validate;
