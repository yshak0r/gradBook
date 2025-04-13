const express = require("express");
const connectDb = require("./configs/db");
const app = express();

const port = process.env.PORT || 2020;
const server = app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});

connectDb();

app.use(express.json());
app.use("/api/v1/search", require("./routes/v1/search_routes"));
app.use("/api/v1/auth", require("./routes/v1/auth_routes"));
app.use("/api/v1/user", require("./routes/v1/user_routes"));
app.use("/api/v1/post", require("./routes/v1/post_routes"));
