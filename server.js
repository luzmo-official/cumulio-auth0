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
  api_token: process.env.CUMULIO_API_TOKEN
});

// Get temporary token based on parameters of user known at auth0
app.get("/authorization", checkJwt, (req, res) => {
  const authNamespace = "https://myexampleapp/";
  // Fill general authorization options, dashboard_id based on request
  let token = {
    type: "sso",
    expiry: "1 day",
    inactivity_interval: "10 minutes",
    integration_id: req.user[authNamespace + "integration_id"],
    role: req.user[authNamespace + "role"],
    username: req.user[authNamespace + "username"],
    name: req.user[authNamespace + "name"],
    email: req.user[authNamespace + "email"],
    suborganization: req.user[authNamespace + "suborganization"]
  };

  // Fill parameters based on parameters of user known at auth0
  if (req.user && req.user[authNamespace + "parameters"]) {
    if(!token.metadata) token.metadata = {};
    Object.keys(req.user[authNamespace + "parameters"]).forEach(parameter => {
      token.metadata[parameter] = req.user[authNamespace + "parameters"][parameter];
    })
  };

  // Create the sso authorization
  client.create("authorization", token)
    .then(function (result) {
      // return the token & key
      return res.status(200).json({ ssoKey: result.id, ssoToken: result.token });
    })
    .catch((error) => {
      console.log("API Error: " + JSON.stringify(error));
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
