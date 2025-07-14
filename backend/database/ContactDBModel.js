const mongoose = require("mongoose");

const ContactSchema = mongoose.Schema({
  name: { type: String, trim: true, required: true },
  phone: { type: String, trim: true, required: true },
  address: { type: String, trim: true },
  notes: { type: String, trim: true },
  isLocked: { type: Boolean, default: false },
});

// 3- create model
const Contacts = mongoose.model("contacts", ContactSchema);

module.exports = Contacts;
