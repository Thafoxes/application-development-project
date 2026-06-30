const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Initialize shared database connection pool
require("./db");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/localData', express.static(path.join(__dirname, '..', 'localData')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import modular routers
const assistantRouter = require("./routes/assistant");
const studentRouter = require("./routes/student");
const authRouter = require("./routes/auth");
const coordinatorRouter = require("./routes/coordinator");
const lookupsRouter = require("./routes/lookups");

// Register modular routers
app.use(assistantRouter);
app.use("/api/projects", studentRouter);
app.use("/api", authRouter);
app.use("/api", coordinatorRouter);
app.use("/api/lookups", lookupsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
