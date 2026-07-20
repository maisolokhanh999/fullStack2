import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./configs/db.js";
import cloudinary from "./configs/cloudinary.js";
import routes from "./router/index.js";
dotenv.config();

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "dev-secret-change-me";
  console.warn("JWT_SECRET chưa được set — đang dùng giá trị mặc định cho dev");
}

const app = express();

app.use(cors());
app.use(express.json());
await cloudinary.config();
await connectDB();

app.use("/", routes);

app.get("/", (req, res) => {
  res.json({ message: "Server running..." });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route không tồn tại" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Lỗi server" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
