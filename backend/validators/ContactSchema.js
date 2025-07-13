const { z } = require("zod");

// Validation for creating a cart
const baseContactSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 letters."),
  phone: z
    .number()
    .int()
    .positive()
    .max(15)
    .min(7, "Phone must be between 7 to 15 digits."),
  address: z.string().min(5, "Address must be at least 5 letters.").optional(),
  notes: z.string().min(5, "Notes must be at least 5 letters.").optional(),
});

const addContactSchema = baseContactSchema;
const updateContactSchema = baseContactSchema.partial();

module.exports = { addContactSchema, updateContactSchema };
