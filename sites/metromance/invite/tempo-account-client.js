const FIREBASE_VERSION = "12.16.0";

const [appModule, authModule] = await Promise.all([
  import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`),
  import(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`),
]);

const { getApps, initializeApp } = appModule;
const {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} = authModule;

let auth;
let currentUser = null;
let readyPromise;

function propertyConfig() {
  return window.TEMPO_ACCOUNT_PROPERTY || {
    id: "unknown",
    name: "Tempo Account",
    loginPath: "/login",
    dashboardPath: "/",
  };
}

async function initialize() {
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    const response = await fetch("/__/firebase/init.json", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Firebase Hosting configuration could not be loaded.");
    }

    const config = await response.json();
    const property = propertyConfig();

    if (
      property.authDomain &&
      location.hostname !== "localhost" &&
      location.hostname !== "127.0.0.1"
    ) {
      config.authDomain = property.authDomain;
    }

    const app = getApps().length ? getApps()[0] : initializeApp(config);
    auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);

    await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        currentUser = user;
        unsubscribe();
        resolve();
      });
    });

    return currentUser;
  })();

  return readyPromise;
}

async function googleSignIn() {
  await initialize();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  currentUser = result.user;
  return currentUser;
}

async function logOut() {
  await initialize();
  await signOut(auth);
  currentUser = null;
}

async function api(path, options = {}) {
  await initialize();

  if (!currentUser) {
    const error = new Error("Please sign in first.");
    error.code = "not-signed-in";
    throw error;
  }

  const token = await currentUser.getIdToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Tempo-Property": propertyConfig().id,
      ...(options.headers || {}),
    },
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = { ok: false, error: `http_${response.status}` };
  }

  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.error || "Request failed.");
    error.code = payload.error || `http_${response.status}`;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function authErrorMessage(error) {
  const code = String(error?.code || error?.message || "");

  if (code.includes("unauthorized-domain")) {
    return "This domain must be added to Firebase Authentication’s Authorized domains list.";
  }

  if (
    code.includes("popup-blocked") ||
    code.includes("cancelled-popup-request")
  ) {
    return "Your browser blocked the Google sign-in window. Try again and allow the pop-up.";
  }

  if (code.includes("popup-closed-by-user")) {
    return "The Google sign-in window was closed before login finished.";
  }

  const invitationMessages = {
    invitation_not_found: "This invitation code is not recognized.",
    invitation_expired: "This invitation has expired.",
    invitation_revoked: "This invitation has been revoked.",
    invitation_fully_claimed: "This invitation has already been fully claimed.",
    invitation_belongs_to_another_product:
      "This invitation belongs to another Tempo Foundry product.",
    invitation_requires_another_email:
      "Sign in with the Google account named by the person who invited you.",
    invitation_requires_email_domain:
      "This invitation requires a Google account from the approved email domain.",
    handle_unavailable:
      "The reserved handle is no longer available. Contact the person who invited you.",
  };

  return invitationMessages[code] || error?.message || "Google sign-in did not finish.";
}

window.TempoAccount = {
  api,
  authErrorMessage,
  googleSignIn,
  initialize,
  logOut,
  propertyConfig,
  user: () => currentUser,
};
