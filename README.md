# Taraz Technologies Lecture Processing Frontend

A lightweight static web frontend that authenticates users with Microsoft Entra ID (via MSAL), collects lecture input, and submits processing jobs to an n8n webhook for lecture-to-diagram PDF generation.

This project is designed for internal/organization use and enforces sign-in with the `@taraztechnologies.com` domain before allowing submissions.

## Features

- Microsoft sign-in using `@azure/msal-browser` (popup flow)
- Client-side domain restriction to `@taraztechnologies.com`
- Simple lecture submission form:
  - Lecture title
  - YouTube or Google Drive URL
- Secure-ready API calls with optional Bearer token header
- Success/error status feedback for end users
- Static-host friendly (works on GitHub Pages)

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- [MSAL Browser](https://www.npmjs.com/package/@azure/msal-browser) via CDN
- n8n webhook backend integration

## Project Structure

```text
.
├── index.html         # App UI and script/style includes
├── app.js             # MSAL auth flow + form submission logic
├── msal-config.js     # Entra ID and auth-related config
├── styles.css         # App styling
└── README.md
```

## How It Works

1. User opens the page and sees a sign-in prompt.
2. User signs in with Microsoft (popup flow through MSAL).
3. App validates that the signed-in account ends with `@taraztechnologies.com`.
4. Submission form is enabled only for authorized users.
5. On submit, the app sends a `POST` request to the configured n8n webhook with:
   - `video_url`
   - `title`
   - `user_email`
6. If token acquisition succeeds, the request includes `Authorization: Bearer <token>`.
7. UI displays success or error details based on response.

## Prerequisites

Before running/deploying, ensure:

- A Microsoft Entra ID app registration exists.
- Redirect URI for your hosted frontend is configured in Entra.
- CORS and auth expectations are set correctly on the receiving backend (`n8n` or API layer).

## Configuration

Edit `msal-config.js`:

- `msalConfig.auth.clientId`: Entra app (client) ID
- `msalConfig.auth.authority`: Tenant authority URL
- `msalConfig.auth.redirectUri`: Public URL where this app is hosted
- `loginRequest.scopes`: Scope list for token acquisition (for protected APIs)
- `allowedEmailDomain`: Domain restriction for signed-in users

Edit `app.js`:

- `endpoint`: webhook/API URL that receives lecture submission jobs

## Local Development

Because this is a static frontend, you can serve it with any local static server.

### Option A: VS Code Live Server

1. Open the project folder.
2. Start Live Server on `index.html`.
3. Test sign-in and submission flow.

### Option B: Python HTTP server

```bash
python -m http.server 5500
```

Then open: `http://localhost:5500`

## Deployment (GitHub Pages)

1. Push this project to a GitHub repository.
2. Enable GitHub Pages (branch: `main`, folder: `/root`).
3. Update `redirectUri` in `msal-config.js` to your GitHub Pages URL.
4. Add the same URL as a Redirect URI in Microsoft Entra app registration.
5. Redeploy and verify login flow.

Example redirect URI format:

```text
https://<github-username>.github.io/<repo-name>
```

## Security Notes

- Client-side domain checks improve UX but are not sufficient for true security.
- Always validate tokens and authorization server-side in your n8n workflow or API.
- Avoid exposing sensitive secrets in frontend code (this app contains public client config only).
- Restrict CORS and allowed callers on backend endpoints.

## Branding / Assets

`index.html` references:

```text
taraz-logo.png
```

Add that file to the project root (or update the `<img src="">` path) to display the logo correctly.

## Troubleshooting

- **MSAL not loading**
  - Confirm internet access and CDN script availability.
- **Sign-in popup blocked**
  - Allow popups for the site in browser settings.
- **`redirect_uri_mismatch`**
  - Ensure `redirectUri` in `msal-config.js` exactly matches Entra app registration.
- **Signed in but form disabled**
  - Check account domain and `allowedEmailDomain` value.
- **Webhook request fails**
  - Verify endpoint URL, CORS config, auth requirements, and backend logs.

## Future Improvements

- Move environment-specific values to build-time config
- Add stronger URL validation for allowed providers
- Add loading/progress indicators for long-running jobs
- Introduce unit and integration tests
- Add backend response parsing for richer status UI

## License

No license file is currently defined in this repository. Add a `LICENSE` file if you plan to distribute externally.

