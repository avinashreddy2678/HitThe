import jwt from "jsonwebtoken";
export const AuthRoute = async (req, res, next) => {
  const tokens = req.headers.authorization;
  const token = tokens.split(" ")[1];

  if (!tokens) {
    return res.json({ msg: "Access denied hello" });
  }
  try {
    const decode = jwt.verify(token, "Secreat");
    req.usr = decode;
    next();
  } catch (error) {
    console.log(error);
  }
};
