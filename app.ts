import express from "express";

const app = express();

app.get("/api/hello", (req, res) => {
  return res.status(200).json({ message: "Hello" });
});

export default app;
