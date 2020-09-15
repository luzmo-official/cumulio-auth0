# Multi-tenant integration example with use of Auth0

Follow the steps below to setup a simple webapp that displays a cumul.io dashboard with multi tenancy. Setting this app will allow you to define rules that determine what each user has access to on your dashboard.

Before you begin, you will need a cumul.io account. 
  
## I. Create a dashboard

  
Here we will use the United Widgets Sales dataset. First, you will have to create a new dashboard. Then you can find the dataset in DATA -> Add new dataset (+) -> Demo Data. Here select United Widgets Sales dataset and Import.

Create a dashboard with a parameter `department` of type `Hierarchy[]` and use it in a dashboard filters on United Widgets - Sales.

## II. Auth0 setup

1. Create an account [here](https://auth0.com/) 

2. In the Applications menu create a new Application and select Single Page Web Applications and in Settings:

    * copy 'Domain' & 'Client ID' to the same attributes in the auth_config.json file

    * set the parameters of:
        
        > Allowed Callback URLs: `http://localhost:3000`
        
        > Allowed Logout URLs: `http://localhost:3000`
        
        > Allowed Web Origins: `http://localhost:3000`
        
    * Save the changes

   in Connections: deactive google-oauth2 (to hide social)

3. In Applications -> APIs copy 'API audience' next to Auth0 Management API to the audience attribute in the auth_config.json file

4. Add some users in User Management -> Users:

    * Go to users & create 2 users: bradpots@exampleapp.com & angelinajulie@exampleapp.com

    * in the `user_metadata` of these users add their firstName and language. In `app_metadata` add their department. (`user_metadata` is meant for user preferences that they could easily change, whereas `app_metadata` is for user information that an admin would control:) 

      for Brad:  `user_metadata = {"firstName": "Brad", "language": "fr" } app_metadata = {"department": "Quadbase" }`

      for Angelina: `user_metadata = {"firstName": "Angelina", "language": "en" } app_metadata = { "department": "Linedoncon"}`

5. In order for the metadata to be able to be extracted from the jwt tokens we need to add a rule.

    * Go to Auth Pipeline -> Rules and create a rule with name 'Add metadata to token' and use the following function:



```javascript
function (user, context, callback) {
  const namespace = 'https://myexampleapp/';
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

Create a file called '.env' in the root directory with two keys. Replace the KEY & TOKEN with the one from your Cumul.io account. You can create one in your Profile settings under API Tokens:

```
CUMULIO_API_KEY=XXX
CUMULIO_API_TOKEN=XXX
``` 

## IV. Run the app and add your dashboard
  1. `npm run start` or if you do not have nodemon, use: `node server.js`
  2. In server.js in the app.get('/authorization'... set the dashboardId to the id you want to use
  3. In public/js/app.js set the dashboardId to the id you want to use
  4. reload and you're set!

  

## V. Final remarks

  * If you want to use other parameters add them to:
    1. the dashboard
    2. the auth0 user
    3. the server authorization call

  * If you use other first names adapt the images in public/images or use the gravatar link from the user in the index.html