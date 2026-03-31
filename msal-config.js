// MSAL configuration.
// TODO: Replace the placeholder values with your real Entra ID details
// before deploying to GitHub Pages.

const msalConfig = {
  auth: {
    clientId: "8d57f49c-fcf6-4805-ae14-89013ee099f1", 
    authority: "https://login.microsoftonline.com/9f1a1bc4-e5b7-4144-99b3-1f692eae04fd",
    redirectUri: "https://taraz-technologies.github.io/LectraAI",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

// Optional scopes for acquiring an access token. If your API (e.g. n8n)
// is protected by Entra ID, set this to the proper scope, e.g.:
// const loginRequest = { scopes: ["api://YOUR_API_APP_ID/.default"] };
// For now you can keep User.Read or adjust as needed.
const loginRequest = {
  scopes: ["User.Read"],
};

// Restrict to your organization domain as an extra client-side check.
const allowedEmailDomain = "@taraztechnologies.com";

