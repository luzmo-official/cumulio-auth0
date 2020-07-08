# Multi-tenant integration example with use of Auth0

## I. App install

`npm install`

create an .env file in the root directory with two keys (replace the KEY & TOKEN with the one from your Cumul.io account):

```
CUMULIO_API_KEY=XXX
CUMULIO_API_TOKEN=XXX
```
  

## II. Auth0 setup

  

1. create an account

2. In the Applications menu -> create a new Application of type single web application & javascript & go to settings

    * copy 'Domain' & 'Client ID' to the same attributes in the auth_config.json file

    * set the parameters of:
        
        > Allowed Callback URLs: `http://localhost:3000`
        
        > Allowed Logout URLs: `http://localhost:3000`
        
        > Allowed Web Origins: `http://localhost:3000`
        
    * Save the changes

    * In the connections tab: deactive google-oauth2 (to hide social)

3. In the API menu -> copy 'API audience' to the audience attribute in the auth_config.json file

4. Add some users:

    * Go to users & create 2 users: bradpots@exampleapp.com & angelinajulie@exampleapp.com

    * in the `user_metadata` of these users add the following info (firstName & language will be used in the app & department will be used in the dashboard parameter)

      for Brad: `{"department": "Antax", "firstName": "Brad", "language": "fr" }`

      for Angelina: `{ "department": "Freshzap", "firstName": "Angelina", "language": "en" }`

5. In order for the metadata to be able to be extracted from the jwt tokens we need to add a rule.

    * Go to Rules and create a rule with name 'Add user metadata to token' and use the following function:



```javascript
function (user, context, callback) {
  const namespace = 'https://myexampleapp/';
  user.user_metadata = user.user_metadata || {};
  Object.keys(user.user_metadata).forEach((k) => {
    context.idToken[namespace + k] = user.user_metadata[k];
    context.accessToken[namespace + k] = user.user_metadata[k];
  });
  callback(null, user, context);
}
```

  

## III. Create a dashboard

  

Create a dashboard with a parameter `department` of type `Hierarchy[]` and use it in a dashboard filters on United Widgets - Sales.

  

## IV. Run the app and add your dashboard
  1. `npm run start` or if you do not have nodemon, use: `node server.js`
  2. In server.js in the app.get('/authorization'... set the dashboardId to the id you want to use
  3. In public/app.js set the dashboardId to the id you want to use
  4. reload and you're set!

  

## X. Final remarks

  * If you want to use other parameters add them to:
    1. the dashboard
    2. the auth0 user
    3. the server authorization call

  * If you use other first names adapt the images in public/images or use the gravatar link from the user in the index.html