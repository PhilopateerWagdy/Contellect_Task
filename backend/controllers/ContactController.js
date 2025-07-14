const Contact = require("../database/ContactDBModel");

// GET ALL CONTACT
const getContacts = async (req, res) => {
  try {
    const { name, phone, address, page, limit } = req.query;

    const filter = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (phone) filter.phone = { $regex: phone, $options: "i" };
    if (address) filter.address = { $regex: address, $options: "i" };

    const skip = (page - 1) * limit;
    const totalContacts = await Contact.countDocuments(filter);
    const contacts = await Contact.find(filter).skip(skip).limit(limit);
    console.log("tc = ", totalContacts);
    console.log("limit = ", limit);

    res.status(200).json({
      totalContacts,
      totalPages: Math.ceil(totalContacts / limit),
      currentPage: page,
      contacts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// ADD CONTACT
const addContact = async (req, res) => {
  try {
    const newContact = new Contact(req.body);
    const savedContact = await newContact.save();

    res.status(201).json(savedContact);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// UPDATE CONTACT
const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedContact = await Contact.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedContact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

// DELETE CONTACT
const deleteContact = async (req, res) => {
  try {
    const deletedContact = await Contact.findByIdAndDelete(req.params.id);

    if (!deletedContact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res
      .status(200)
      .json({ message: "Contact deleted successfully.", deleteContact });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = { addContact, getContacts, updateContact, deleteContact };
