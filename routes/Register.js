import express from "express";
import User from "../Models/User.js";
import { z } from "zod";
import bcrypt from "bcrypt"; // Import bcrypt
import jwt from "jsonwebtoken";
import { generateVerificationTokenbyEmailandId } from "../libs/generateVerificationTokenbyEmailandId.js";
import { sendMail } from "../libs/sendMail.js";
import { getTokenbyToken, getUserbyEmail } from "../libs/getTokenbyToken.js";
import VerifcationTable from "../Models/VerifcationTable.js";
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
    const verifyMail = await generateVerificationTokenbyEmailandId(
      newUser._id,
      newUser.email
    );
    await sendMail(email, verifyMail.token);
    // Respond with success
    return res.status(201).json({
      msg: "User created successfully and verification mail is sent!",
      user: newUser,
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
    bcrypt.compare(password, existingUser.password, (err, result) => {
      if (err) {
        return res.json({ msg: "something went wrong" });
      }
      if (!result) {
        return res.json({ msg: "password incorrect" });
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
*      summary: Verify user email with token
*      description: This endpoint verifies a user's email using a token. If the token has expired, a new token is generated and sent to the user's email.
*      tags:
*        - Verification
*      parameters:
*        - in: query
*          name: token
*          schema:
*            type: string
*          required: true
*          description: Verification token sent to the user’s email
*      responses:
*        200:
*          description: Successful email verification or token renewal
*          content:
*            application/json:
*              schema:
*                type: object
*                properties:
*                  msg:
*                    type: string
*                    example: "Email verified successfully" # This message will vary depending on the response
*        400:
*          description: Token missing or expired
*          content:
*            application/json:
*              schema:
*                type: object
*                properties:
*                  msg:
*                    type: string
*                    example: "Token is missing in Database"
*        500:
*          description: Internal server error
*          content:
*            application/json:
*              schema:
*                type: object
*                properties:
*                  msg:
*                    type: string
*                    example: "Something went wrong"

 */

router.get("/verify", async (req, res) => {
  try {
    const token = req.query.token;
    // console.log(token)
    const existingToken = await getTokenbyToken(token);
    if (!existingToken) {
      return res.json({ msg: "Token is missing in Database" });
    }
    const hasExpired = (await existingToken.expiresIn) < new Date();
    if (hasExpired) {
      // if expires then create new token
      const verificationToken = await generateVerificationTokenbyEmailandId(
        existingToken.userId,
        existingToken.email
      );

      await sendMail(verificationToken.email, verificationToken.token);
      return res.json({
        msg: "Token expired and genereated new token sent to mail",
      });
    }

    // unique code for user to share

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
        email: existingToken.email,
      },
      {
        emailVerified: true,
      },
      {
        UserCode: result,
      },
      {
        new: true,
      }
    );

    if (!existingUser) {
      return res.json({ msg: "Somethinf went wrong" });
    }
    await VerifcationTable.deleteOne({ token });

    return res.json({ msg: "Email verified successfully" });
  } catch (error) {
    console.log(error);
  }
});

export { router as UserRoute };
