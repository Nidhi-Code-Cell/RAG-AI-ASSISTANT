import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { getSolution } from "./query.js";


const app = express();

app.use(cors());
app.use(express.json());

app.post("/ask", async (req, res) => {
  const { question } = req.body;

  const answer = await getSolution(question);

  res.json({ answer });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
