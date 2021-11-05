const dashboardElement = document.querySelector('cumulio-dashboard');

// Function to retrieve the dashboard authorization token from the platform's backend
const getDashboardAuthorizationToken = async () => {
  try {
    // Get the platform access credentials from the current logged in user
    const accessCredentials = await auth0.getTokenSilently();
    /*
      Make the call to the backend API, using the platform user access credentials in the header
      to retrieve a dashboard authorization token for this user
    */
    const response = await fetch("/authorization", {
      headers: new Headers({
        Authorization: `Bearer ${accessCredentials}`,
      }),
    });
    // Fetch the JSON result with the Cumul.io Authorization key & token
    const responseData = await response.json();
    return responseData;
  } catch (e) {
    // Display errors in the console
    console.error(e);
    return { error: "Could not retrieve dashboard authorization token." };
  }
};

function changeLanguage(language, elem) {
  document.querySelectorAll(".language-btn").forEach((el) => {
    el.classList.remove("active");
  });
  elem.classList.add("active");
  toggleMenu(false);
  dashboardElement.language = language;
  loadDashboard();
}

// Function to fetch tabs & dashboards from the backend
const fetchAndLoadDashboards = async () => {
  // Get the dashboards in the integration
  dashboardElement.getAccessibleDashboards()
  .then(dashboards => {
    const menu = document.getElementById('tabs');
    if (dashboards.length > 0) {
      dashboardElement.dashboardId = dashboards[0].id;
      dashboards.forEach((dashboard, i) => {
        const newOption = document.createElement('li');
        if (i === 0) newOption.classList.toggle('active');
        newOption.classList.add('nav-item');
        const localizedName = dashboard.name[Object.keys(dashboard.name)[0]];
        newOption.innerHTML = `
            <a class="menu-item">${localizedName ? localizedName : 'Dashboard -' + i}</a>
          `;
        newOption.onclick = () => {
          dashboardElement.dashboardId = dashboard.id;
          const options = menu.querySelectorAll('li');
          for (const option of options) {
            if (option.isSameNode(newOption)) option.classList.add('active');
            else option.classList.remove('active');
          }
        };
        menu.appendChild(newOption);
      });
    }
  });
};


// loads the user interface
const initUI = async () => {
  const isAuthenticated = await auth0.isAuthenticated();
  if (isAuthenticated) {
    getDashboardAuthorizationToken()
    .then(authorization => {
      // We can now set the key and token to the dashboard component.
      dashboardElement.authKey = authorization.ssoKey;
      dashboardElement.authToken = authorization.ssoToken;
      return fetchAndLoadDashboards();
    })
    .then(() => {
      return auth0.getUser();
    })
    .then(user => {
      return setUserDetails(user);
    })
  } else {
    login();
  }
};

// set the user details in the UI
const setUserDetails = (user) => {
  const userLanguage = user[namespace + "language"];
  if (userLanguage) {
    document.querySelectorAll(".language-btn").forEach((el) => {
      if (el.dataset.language === userLanguage) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
    if (dashboardElement) dashboardElement.language = userLanguage;
  }
  document.getElementById("user-name").textContent =
    user[namespace + "firstName"];
  document.getElementById("user-image").src = user['picture'];
};

// on page load
window.onload = async () => {
  await configureClient();
  const isAuthenticated = await auth0.isAuthenticated();

  // If is logged in -> init UI
  if (isAuthenticated) {
    return initUI();
  }

  const query = window.location.search;
  // If redirected from login
  if (query.includes("code=") && query.includes("state=")) {
    // Process the login state
    await auth0.handleRedirectCallback();
    // Set app state based on login
    initUI();
    // Use replaceState to redirect the user away and remove the querystring parameters
    window.history.replaceState({}, document.title, "/");
  }
  // If not logged in not redirected
  else {
    initUI();
  }
};

const toggleMenu = (boolean) => {
  if (boolean) {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('open');
  }
  else {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('open');
  }
};

/* Authentication configuration */
let auth0 = null;
const namespace = "https://myexampleapp/";
const fetchAuthConfig = () => fetch("/auth_config.json");
const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();
  auth0 = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId,
    audience: config.audience,
  });
};

// login function
const login = async () => {
  await auth0.loginWithRedirect({
    redirect_uri: window.location.origin,
  });
};

// logout function
const logout = () => {
  auth0.logout({
    returnTo: window.location.origin,
  });
};
