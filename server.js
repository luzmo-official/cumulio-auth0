require("dotenv").load();
const express = require("express");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const { join } = require("path");
const app = express();
const authConfig = require("./auth_config.json");
const Cumulio = require("cumulio");
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"],
});

const client = new Cumulio({
  api_key: process.env.CUMULIO_API_KEY,
  api_token: process.env.CUMULIO_API_TOKEN,
});

app.get("/authorization", checkJwt, (req, res) => {
  const authNamespace = "https://cumulio/";
  // console.log("REQ: ", req);
  console.log("REQ USER:\n ", req.user);
  console.log("Integration ID:\n" + req.user[authNamespace + "integration_id"]);
  client
    .create("authorization", {
      type: "sso",
      expiry: "24 hours",
      inactivity_interval: "30 minutes",
      integration_id: req.user[authNamespace + "integration_id"],
      role: req.user[authNamespace + "role"],
      name: req.user[authNamespace + "name"],
      username: req.user[authNamespace + "username"],
      email: req.user[authNamespace + "email"],
      suborganization: req.user[authNamespace + "department"],
      metadata: {
        department: [req.user[authNamespace + "department"]],
        join_date: [req.user[authNamespace + "join_date"]],
      },
    })
    .then((result) => {
      console.log(result);
      return res
        .status(200)
        .json({ ssoKey: result.id, ssoToken: result.token });
    });
});

// Serve static assets from the /public folder
app.use(express.static(join(__dirname, "public")));

// Endpoint to serve the configuration file
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

app.use(function (err, req, res, next) {
  if (err) console.log(err);
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }
  next(err, req, res);
});

// Serve the index page for all other requests
app.get("/*", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// Listen on port 3000
app.listen(3000, () => console.log("Application running on port 3000"));
