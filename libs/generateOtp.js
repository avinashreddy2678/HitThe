import VerifcationTable from "../Models/VerifcationTable.js";
export const generateOtp = async (id, email) => {
  try {
    const existingOtp = await VerifcationTable.findOne({ email });
    if (existingOtp) {
      await VerifcationTable.deleteMany({ email });
    }
    // generating token only with id
    const expiresIn = new Date(new Date().getTime() + 300 * 1000);

    const generateOtp = Math.floor(10000 + Math.random() * 90000);
    const generatedVerification = await VerifcationTable.create({
      email: email,
      userId: id,
      expiresIn,
      Otp: generateOtp,
    });
    await generatedVerification.save();

    return generatedVerification;
  } catch (error) {
    console.log(error);
    return null;
  }
};
