// Simple frontend using MSAL.js to authenticate and call the n8n webhook.

const msalInstance = new msal.PublicClientApplication(msalConfig);

const signinBtn = document.getElementById("signin-btn");
const signoutBtn = document.getElementById("signout-btn");
const authStatusEl = document.getElementById("auth-status");
const formEl = document.getElementById("video-form");
const submitBtn = document.getElementById("submit-btn");
const resultEl = document.getElementById("result");

let currentAccount = null;
let currentAccessToken = null;
let currentUserEmail = null;

function setAuthStatus(message, type) {
  authStatusEl.textContent = message;
  authStatusEl.classList.remove(
    "tt-auth-status-warning",
    "tt-auth-status-ok",
    "tt-auth-status-error"
  );
  authStatusEl.classList.add(
    type === "ok"
      ? "tt-auth-status-ok"
      : type === "error"
      ? "tt-auth-status-error"
      : "tt-auth-status-warning"
  );
}

function setSignedInState(isSignedIn) {
  if (isSignedIn) {
    formEl.classList.remove("tt-form-disabled");
    signinBtn.classList.add("tt-button-hidden");
    signoutBtn.classList.remove("tt-button-hidden");
  } else {
    formEl.classList.add("tt-form-disabled");
    signinBtn.classList.remove("tt-button-hidden");
    signoutBtn.classList.add("tt-button-hidden");
  }
}

function showResult(message, isError = false) {
  resultEl.classList.remove("tt-result-hidden", "tt-result-success", "tt-result-error");
  resultEl.classList.add(isError ? "tt-result-error" : "tt-result-success");
  resultEl.textContent = message;
}

async function handleLogin() {
  try {
    const loginResponse = await msalInstance.loginPopup(loginRequest);
    handleResponse(loginResponse);
  } catch (err) {
    console.error("Login failed", err);
    setAuthStatus("Sign-in failed. Please try again or contact IT.", "error");
  }
}

function handleResponse(response) {
  if (response && response.account) {
    currentAccount = response.account;
  } else {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      currentAccount = accounts[0];
    }
  }

  if (!currentAccount) {
    setSignedInState(false);
    setAuthStatus(
      "Please sign in with your Taraz Technologies Microsoft account to continue.",
      "warning"
    );
    return;
  }

  // Extra client-side domain check.
  const username = currentAccount.username || currentAccount.localAccountId || "";
  currentUserEmail = username || null;
  if (!username.toLowerCase().endsWith(allowedEmailDomain)) {
    setSignedInState(false);
    setAuthStatus(
      "Signed-in account is not from taraztechnologies.com. Please use your organization email.",
      "error"
    );
    return;
  }

  setSignedInState(true);
  setAuthStatus(`Signed in as ${username}`, "ok");
}

async function getToken() {
  if (!currentAccount) return null;
  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account: currentAccount,
    });
    return response.accessToken;
  } catch (err) {
    console.warn("Silent token acquisition failed, trying popup", err);
    const response = await msalInstance.acquireTokenPopup(loginRequest);
    return response.accessToken;
  }
}

async function init() {
  // REQUIRED for @azure/msal-browser v3+: initialize before any other MSAL calls.
  try {
    await msalInstance.initialize();
  } catch (error) {
    console.error("MSAL initialization failed", error);
    setAuthStatus("Authentication library failed to initialize. Please refresh or contact IT.", "error");
    setSignedInState(false);
    return;
  }

  // Handle redirect if used (we mainly use popup here, but this keeps things robust).
  msalInstance
    .handleRedirectPromise()
    .then((response) => {
      if (response) {
        handleResponse(response);
      } else {
        handleResponse(null);
      }
    })
    .catch((error) => {
      console.error(error);
    });

  signinBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogin();
  });

  signoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    msalInstance.logoutPopup().finally(() => {
      currentAccount = null;
      currentAccessToken = null;
      setSignedInState(false);
      setAuthStatus(
        "Please sign in with your Taraz Technologies Microsoft account to continue.",
        "warning"
      );
      resultEl.classList.add("tt-result-hidden");
    });
  });

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    resultEl.classList.add("tt-result-hidden");

    const videoUrl = document.getElementById("video-url").value.trim();
    const title = document.getElementById("video-title").value.trim();
    if (!videoUrl) {
      showResult("Please provide a YouTube or Google Drive URL.", true);
      return;
    }

    if (!currentAccount) {
      showResult("You must sign in before submitting a video URL.", true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    try {
      if (!currentAccessToken) {
        currentAccessToken = await getToken();
      }

      // n8n webhook endpoint – current production URL you shared.
      const endpoint =
        "https://taraztechnologies.app.n8n.cloud/webhook/youtube-to-pdf";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Optional: if/when you validate Microsoft tokens on the n8n/API side,
          // keep this Authorization header and validate the token server-side.
          ...(currentAccessToken
            ? { Authorization: `Bearer ${currentAccessToken}` }
            : {}),
        },
        body: JSON.stringify({
          video_url: videoUrl,
          title,
          user_email: currentUserEmail || "",
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        showResult(
          `Request failed (${response.status}). Server response: ${text || "no body"}`,
          true
        );
        return;
      }

      let payload;
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        payload = await response.json();
      } else {
        payload = await response.text();
      }

      // Show a simple job-submitted message + any download URL if present.
      if (payload && typeof payload === "object") {
        const downloadUrl =
          payload.download_url ||
          payload.downloadUrl ||
          payload.result_url ||
          payload.resultUrl;
        if (downloadUrl) {
          showResult(
            `Job submitted successfully. Download URL: ${downloadUrl}`,
            false
          );
        } else {
          showResult(
            `Job submitted successfully. Response: ${JSON.stringify(payload)}`,
            false
          );
        }
      } else {
        showResult(`Job submitted successfully. Response: ${payload}`, false);
      }
    } catch (err) {
      console.error("Submission failed", err);
      showResult("An error occurred while submitting the job. Check console logs.", true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit for processing";
    }
  });
}

init();

