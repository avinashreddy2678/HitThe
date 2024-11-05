import jwt from "jsonwebtoken";
import VerifcationTable from "../Models/VerifcationTable.js";
export const generateVerificationTokenbyEmailandId = async (id, email) => {
  try {
    const existingToken = await VerifcationTable.findOne({ email });
    if (existingToken) {
      await VerifcationTable.deleteMany({ email });
    }
    // generating token only with id
    const token = jwt.sign({ id }, "Secreat");
    const expiresIn = new Date(new Date().getTime() + 3600 * 1000);

    const generatedVerification = await VerifcationTable.create({
      email: email,
      userId: id,
      expiresIn,
      token,
    });
    await generatedVerification.save();

    return generatedVerification;
  } catch (error) {
    console.log(error);
    return null;
  }
};
