const { z } = require("zod");

// Validation for creating a cart
const baseContactSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 letters."),
  phone: z.coerce
    .number()
    .int()
    .positive()
    .min(1000000, "Phone must be at least 7 digits")
    .max(999999999999999, "Phone must be at most 15 digits"),
  address: z.string().min(5, "Address must be at least 5 letters.").optional(),
  notes: z.string().min(5, "Notes must be at least 5 letters.").optional(),
});

const getContactsSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  page: z
    .string()
    .default("1")
    .transform((val) => parseInt(val))
    .refine((val) => Number.isInteger(val) && val > 0, {
      message: "'page' must be a positive integer.",
    }),
  limit: z
    .string()
    .default("5")
    .transform((val) => parseInt(val))
    .refine((val) => Number.isInteger(val) && val > 0, {
      message: "'limit' must be a positive integer.",
    }),
});

const addContactSchema = baseContactSchema;
const updateContactSchema = baseContactSchema.partial();

module.exports = { getContactsSchema, addContactSchema, updateContactSchema };
