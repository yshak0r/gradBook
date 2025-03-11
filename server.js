const express = require("express");
const app = express();

const port = process.env.PORT || 2020;
const server = app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});

app.use("/auth", require("./routes/auth_routes"));
