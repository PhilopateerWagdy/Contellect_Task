const express = require("express");
const router = express.Router();

const validate = require("../middlewares/validate");
const { loginSchema } = require("../validators/AuthSchema");
const { login } = require("../controllers/AuthController");

// Middleware message
router.all("/", (req, res, nxt) => {
  console.log("request recieved in Users Contoller.");
  nxt();
});

router.post("/login", validate(loginSchema), login);

module.exports = router;
