const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body); // Replace with validated data
    next();
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({
        message: "Validation failed",
        errors: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = validate;
