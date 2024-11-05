import User from "../Models/User.js";
import VerifcationTable from "../Models/VerifcationTable.js";

export const getOtpVerify = async (email, Otp) => {
  try {
    const existingOtp = await VerifcationTable.findOne({
      email,
    });

    return existingOtp;
  } catch (error) {
    console.log(error);
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    const existingOtp = await VerifcationTable.findOne({
      email,
    });

    if (existingOtp.Otp != otp) {
      return false
    }
    await VerifcationTable.deleteMany({ email });
    return true;
  } catch (error) {
    console.log(error);
  }
};

export const getUserbyEmail = async (email) => {
  try {
    const User = await User.findOne({ email });
    return User;
  } catch (error) {
    console.log(error);
  }
};
