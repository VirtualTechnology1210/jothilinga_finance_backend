const express = require("express");
const app = express();
const path = require("path");
const envFile = `.env.${process.env.NODE_ENV}`;
const apiRoutes = require("./routes/routes.js");
const cors = require("cors");
const bodyParser = require("body-parser");
const { sequelize } = require("./models/index.js");

require("dotenv").config({ path: path.resolve(__dirname, "", envFile) });

app.use(express.json());

app.use(
  cors({
    origin: `http://localhost:3000`,
    credentials: true,
  })
);

// app.use(
//   cors({
//     origin: "*",
//     credentials: true,
//   })
// );

// Add body-parser middleware here
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json());

// Serve the frontend static files
app.use("/images", express.static(path.join(__dirname, "uploads/documents")));

// Serve the frontend static files
app.use(express.static(path.join(__dirname, "/public")));

app.use("/api", apiRoutes);

// Serve the frontend app for any other requests
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

const PORT = process.env.PORT || 5001;
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Sync database (optional, depending on your needs)
    // await sequelize.sync();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1); // Exit the process with failure code
  }
};

startServer();
