import User from "../Models/User.js";
import VerifcationTable from "../Models/VerifcationTable.js";

export const getTokenbyToken = async (token) => {
  try {
    const existingToken = await VerifcationTable.findOne({
      token,
    });
    
    return existingToken;
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
