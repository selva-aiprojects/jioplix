require("dotenv/config");
if (!process.env.PORT) process.env.PORT = "4001";
require("./backend/index.js");
