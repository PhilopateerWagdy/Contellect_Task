const { z } = require("zod");

const loginSchema = z.object({
  username: z.string().min(3, "Name must be at least 3 letters."),
  password: z.string().min(5, "Password must be at least 5 letters."),
});

module.exports = { loginSchema };
