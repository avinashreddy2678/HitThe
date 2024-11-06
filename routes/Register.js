import express from "express";
import User from "../Models/User.js";
import { z } from "zod";
import bcrypt from "bcrypt"; // Import bcrypt
import jwt from "jsonwebtoken";
import { generateOtp } from "../libs/generateOtp.js";
import { sendMail } from "../libs/sendMail.js";
import VerifcationTable from "../Models/VerifcationTable.js";
import { getOtpVerify, verifyOtp } from "../libs/getOtpVerify.js";
const router = express.Router();

const userSchema = z.object({
  name: z.string().min(3),
  password: z.string().min(4),
  email: z.string().email(),
  profileDp: z.string().optional(),
});

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Register a new user
 *     description: Enter name, password, email, and profile DP to create a new user.

 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: email
 *               password:
 *                 type: string
 *               profileDp:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad Request (Validation error)
 *       409:
 *         description: Conflict (User already exists)
 *       500:
 *         description: Internal Server Error
 */

router.post("/register", async (req, res) => {
  try {
    const parsedData = userSchema.parse(req.body);
    const { name, email, password, profileDp } = parsedData;

    const checkUser = await User.findOne({ email });
    if (checkUser) {
      if (!checkUser.emailVerified) {
        return res.status(403).json({ msg: "User exists but not verified." });
      }
      return res.status(409).json({ msg: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      profileDp,
      createdAt: new Date(),
    });
    const generatedOtp = await generateOtp(newUser._id, newUser.email);

    await sendMail(email, generatedOtp.Otp);

    const userResponse = { ...newUser._doc };
    delete userResponse.password;
    // Respond with success
    return res.status(201).json({
      msg: "User created successfully and verification Otp is sent!",
      user: userResponse,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ msg: error.errors });
    }
    console.error(error); // Log the error for debugging
    return res.status(500).json({ msg: "Internal server error." });
  }
});

router.post("/google", async (req, res) => {
  const { tokenId } = req.body;
  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenId}`
    );
    const { sub: googleId, email, name } = response.data;
    const UserExists = await User.findOne({ googleId });
    if (!UserExists) {
      newUser = new User({
        name,
        email,
        googleId,
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.log(error);
  }
});

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Login to the account
 *     description: Enter email and password to log in.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       404:
 *         description: User not found
 *       401:
 *         description: Incorrect password
 *       500:
 *         description: Server error
 */

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ msg: "User not Exists" });
    }
    if (!existingUser.emailVerified) {
      const generatedOtp = await generateOtp(
        existingUser._id,
        existingUser.email
      );

      await sendMail(email, generatedOtp.Otp);
      return res
        .status(400)
        .json({ msg: "Exists but not verified sent Mail please Verify" });
    }

    bcrypt.compare(password, existingUser.password, (err, result) => {
      if (err) {
        return res.status(400).json({ msg: "something went wrong" });
      }
      if (!result) {
        return res.status(400).json({ msg: "password incorrect" });
      }
      const token = jwt.sign(
        { id: existingUser._id, email: existingUser.email },
        "Secreat"
      );
      return res.json({ token });
    });
  } catch (error) {
    console.log(error);
  }
});

/**
 * @swagger
 * /user/verify:
 *  get:
 *    summary: Verify user email with OTP
 *    description: This endpoint verifies a user's email using an OTP. If the OTP has expired, a new one is generated and sent to the user's email. If the OTP is valid, the user's email is marked as verified and a unique user code is generated.
 *    tags:
 *      - Verification
 *    parameters:
 *      - in: query
 *        name: email
 *        schema:
 *          type: string
 *        required: true
 *        description: The user's email address for verification
 *      - in: query
 *        name: otp
 *        schema:
 *          type: string
 *        required: true
 *        description: OTP sent to the user's email for verification
 *    responses:
 *      200:
 *        description: Successful email verification or OTP renewal
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                msg:
 *                  type: string
 *                  example: "Email verified successfully"
 *                user:
 *                  type: object
 *                  properties:
 *                    emailVerified:
 *                      type: boolean
 *                      example: true
 *                    UserCode:
 *                      type: string
 *                      example: "A1b2C3d4E5"
 *      400:
 *        description: OTP is missing, invalid, or has expired
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                msg:
 *                  type: string
 *                  example: "Token is missing in Database"
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                msg:
 *                  type: string
 *                  example: "Something went wrong"
 */

router.get("/verify", async (req, res) => {
  try {
    const { email, otp } = req.query;
    // console.log(token)
    const existingOtp = await getOtpVerify(email, otp);
    if (!existingOtp) {
      return res.json({ msg: "Token is missing in Database" });
    }
    const hasExpired = (await existingOtp.expiresIn) < new Date();
    if (hasExpired) {
      // if expires then create new token
      const verificationOtp = await generateOtp(
        existingOtp.userId,
        existingOtp.email
      );

      await sendMail(verificationOtp.email, verificationOtp.Otp);
      return res.json({
        msg: "Token expired and genereated new token sent to mail",
      });
    }

    const verifiedOtp = await verifyOtp(email, otp);
    if (!verifiedOtp) {
      return res.status(204).json({ msg: "Otp is Wrong" });
    }
    // unique code for user to share
    if (verifiedOtp) {
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < 10; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }

      const existingUser = await User.findOneAndUpdate(
        {
          email: existingOtp.email,
        },
        {
          emailVerified: true,
          UserCode: result,
        },

        {
          new: true,
        }
      );
      await existingUser.save();
      await VerifcationTable.deleteOne({ email });
    }

    if (!existingOtp) {
      return res.json({ msg: "Somethinf went wrong" });
    }
    const token = jwt.sign(
      { id: existingUser._id, email: existingUser.email },
      "Secreat"
    );
    const userResponse = { ...existingUser._doc };
    delete userResponse.password;

    return res.json({
      msg: "Email verified successfully",
      token,
      userResponse,
    });
  } catch (error) {
    console.log(error);
  }
});

export { router as UserRoute };
