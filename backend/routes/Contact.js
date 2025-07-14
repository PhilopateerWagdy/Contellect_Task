const express = require("express");
const router = express.Router();

const validate = require("../middlewares/validate");
const {
  getContactsSchema,
  addContactSchema,
  updateContactSchema,
} = require("../validators/ContactSchema");
const contactController = require("../controllers/ContactController");
const authorize = require("../middlewares/authorize");

// Middleware message
router.all("/", (req, res, nxt) => {
  console.log("request recieved in Contacts Contoller.");
  nxt();
});

// CRUD Operations
router.get(
  "/",
  validate(getContactsSchema, "query"),
  contactController.getContacts
);
router.post("/", validate(addContactSchema), contactController.addContact);
router.put(
  "/:id",
  validate(updateContactSchema),
  contactController.updateContact
);
// I assume only admins can delete contact
router.delete("/:id", authorize("admin"), contactController.deleteContact);

// Lock/unlock updating endpoints
router.post("/:id/lock", contactController.lockContact);
router.post("/:id/unlock", contactController.unlockContact);

module.exports = router;
