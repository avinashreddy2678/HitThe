import express from "express";

import Rooms from "../Models/Rooms.js";
import User from "../Models/User.js";

const router = express.Router();

/**
 * @swagger
 * /Room/getRooms:
 *   get:
 *     summary: Return the count of Rooms
 *     description: Requires a Bearer token for authorization; returns the count of rooms for the user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved count of rooms.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 10
 *       401:
 *         description: Unauthorized access, invalid token.
 */

router.get("/getRooms", async (req, res) => {
  const { id, email } = req.usr;
  try {
    const Owner = await User.findOne({ _id: id });
    return res.json({ Room_count: Owner.Rooms.length, Rooms: Owner.Rooms });
  } catch (error) {
    console.log(error);
  }
});

/**
 * @swagger
 * /Room/AddRoom:
 *   post:
 *     summary: Add a new room
 *     description: Requires a Bearer token for authorization; adds a new room for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               RoomNo:
 *                 type: string
 *                 example: "101"
 *     responses:
 *       200:
 *         description: Successfully added a room.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 room:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60c72b2f9b1d4e4d30e8a9f7"
 *                     RoomNo:
 *                       type: string
 *                       example: "101"
 *       400:
 *         description: Failed to add room, validation error or other issues.
 *       401:
 *         description: Unauthorized access, invalid token.
 */

router.post("/AddRoom", async (req, res) => {
  const { id, email } = req.usr;
  const { RoomNo } = req.body;
  try {
    const Owner = await User.findOne({ _id: id });
    const CreateRoom = await Rooms.create({
      RoomNo,
    });
    await Owner.Rooms.push(CreateRoom._id);
    await Owner.save();
    await CreateRoom.save();
    return res.status(200).json({ msg: "Room created Succuess" });
  } catch (error) {
    return res.status(404).json({
      msg: "Already Room Created",
    });
  }
});

router.get("/getRoom/:id", (req, res) => {
  // return rooms and
});

export { router as RoomRouter };
