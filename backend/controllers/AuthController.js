const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const users = [
  { username: "user1", password: "user1", role: "admin" },
  { username: "user2", password: "user2", role: "user" },
];

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).header("x-auth-token", token).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { login };
