# Multi-tenant integration example with use of Auth0

Follow the steps below to setup a simple webapp that displays a [Cumul.io](https://cumul.io) dashboard with multi tenancy. Setting this app will allow you to define rules that determine what each user has access to on your dashboard.

Before you begin, you will need a [Cumul.io](https://cumul.io) account.

## I. Create a dashboard

You can create as many dashboards as you'd like.

## II. Create an Integration

Add the dashboards you want to use in this application all into an 'Integration' in Cumul.io. Per user you can determine which integration they will see, so depending on their role, company, license, ... you can control which dashboards they see by creating separate integrations. We will use the Integration ID to create an SSO token and embed the dashboards into the application.

## III. Auth0 setup

1. Create an account [here](https://auth0.com/)

2. In the Applications menu create a new Application and select Single Page Web Applications and in Settings:

   - copy 'Domain' & 'Client ID' to the same attributes in the auth_config.json file

   - set the parameters of:
     > Allowed Callback URLs: `http://localhost:3000`
     > Allowed Logout URLs: `http://localhost:3000`
     > Allowed Web Origins: `http://localhost:3000`
   - Save the changes

   in Connections: deactive google-oauth2 (to hide social)

3. In Applications -> APIs copy 'API audience' next to Auth0 Management API to the audience attribute in the auth_config.json file

4. Add some users in User Management -> Users:

   - Go to users & create a user
   
   - You should add the following properties to the `user_metadata` of a user:

      - `firstName`
      - `name`
      - `email`
      - `language`

      An example of the `user_metadata`:

      ```json
        {
          "firstName": "Angelina",
          "language": "nl",
          "email": "angelinajulie@exampleapp.com",
          "name": "Angelina Julie"
        }
      ```

    - You should add the following properties to the `app_metadata` of a user:
    
      - `parameters`: object containing parameter names and their values. These parameter filters will **ALWAYS** be applied in the authorization token, so e.g. useful for row-level security per client.
      - `role`: viewer or designer
      - `integration_id`: id of the integration the user should see 'see step II Create an Integation'
      - `suborganization`: [suborganization](https://academy.cumul.io/article/rqn97pna) of the user
      - `username`: unique, immutable username

          An example of the `app_metadata`:

          ```json
          {
              "parameters": {
                  "<parameter name>": ["<parameter value 1>", "<parameter value 2>"]
              },
              "role": "viewer",
              "integration_id": "xxxxx",
              "suborganization": "client 1",
              "username": "123456"
          }
          ```

      (`user_metadata` is meant for user preferences that they could easily change, whereas `app_metadata` is for user information that an admin would control)

5. In order for the metadata to be able to be extracted from the jwt tokens we need to add a rule.

   - Go to Auth Pipeline -> Rules and create a rule with name 'Add metadata to token' and use the following function:

```javascript
function (user, context, callback) {
  const namespace = 'https://cumulio/';
  user.user_metadata = user.user_metadata || {};
  Object.keys(user.user_metadata).forEach((k) => {
    context.idToken[namespace + k] = user.user_metadata[k];
    context.accessToken[namespace + k] = user.user_metadata[k];
  });
  Object.keys(user.app_metadata).forEach((k) => {
    context.idToken[namespace + k] = user.app_metadata[k];
    context.accessToken[namespace + k] = user.app_metadata[k];
  });
  callback(null, user, context);
}
```

## III. App install

`npm install`

Create a file called '.env' in the root directory with two keys. Replace the KEY & TOKEN with the one from your [Cumul.io account](https://app.cumul.io/start/profile/integration). You can create one in your Profile settings under API Tokens:

```
CUMULIO_API_KEY=XXX
CUMULIO_API_TOKEN=XXX
```

## IV. Run the app and add your dashboard

1. `npm run start` or if you do not have nodemon, use: `node server.js`
2. Each time you add/remove dashboards, or change something to server.js you will have to restart the server. Changes to e.g. public/js/app.js do not require a server restart, but could be cached on the client side so it could be that you have to hard-refresh your browser in order to see the changes.
