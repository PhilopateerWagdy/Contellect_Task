const express = require("express");
const router = express.Router();

const validate = require("../middlewares/validate");
const {
  addContactSchema,
  updateContactSchema,
} = require("../validators/ContactSchema");
const contactController = require("../controllers/ContactController");

// Middleware message
router.all("/", (req, res, nxt) => {
  console.log("request recieved in Contacts Contoller.");
  nxt();
});

// CRUD Operations
router.get("/", contactController.getContacts);
router.post("/", validate(addContactSchema), contactController.addContact);
router.put(
  "/:id",
  validate(updateContactSchema),
  contactController.updateContact
);
router.delete("/:id", contactController.deleteContact);

module.exports = router;
