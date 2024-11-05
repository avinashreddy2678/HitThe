import jwt from "jsonwebtoken";
import User from "../Models/User.js";

export const AuthRoute = async (req, res, next) => {
  const tokens = req.headers.authorization;
  const token = tokens.split(" ")[1];

  if (!tokens) {
    return res.json({ msg: "Access denied hello" });
  }
  try {
    const decode = jwt.verify(token, "Secreat");
    const id = decode.id;
    const checkUser = await User.findOne({ _id: id });

    if (!checkUser) {
      return;
    }
    if (!checkUser.emailVerified) {
      return res.status(500).json({ msg: "Email not verified" });
    }
    req.usr = decode;
    next();
  } catch (error) {
    console.log(error);
  }
};
