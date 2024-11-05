import express from "express";
import Cors from "cors";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
import { UserRoute } from "./routes/Register.js";
import mongoose from "mongoose";
import { RoomRouter } from "./routes/RoomRoute.js";
import { AuthRoute } from "./Middleware/Auth.js";
dotenv.config();
const app = express();
mongoose.connect(process.env.MONGO_URI);
const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "Rest Apis for GymApp",
      version: "1.0.0",
      description: "A simple aPi library",
    },

    servers: [
      {
        url: "http://localhost:4001",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJSDoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(Cors());
app.use(express.json());
app.use("/user", UserRoute);
app.use("/Room", AuthRoute, RoomRouter);
app.listen(process.env.PORT_NUMBER || 4001, () => {
  console.log(`Server is On Fire`);
});
