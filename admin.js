import {getApp, getApps, initializeApp} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {initializeAppCheck, ReCaptchaV3Provider} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app-check.js";
import {
  RecaptchaVerifier,
  getAuth,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  collection,
  doc,
  getFirestore,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const loginPanel = document.getElementById("ownerLoginPanel");
const phoneForm = document.getElementById("reviewerPhoneForm");
const otpForm = document.getElementById("reviewerOtpForm");
const dashboard = document.getElementById("reviewerDashboard");
const queue = document.getElementById("requestQueue");
const status = document.getElementById("reviewerStatus");
let auth;
let database;
let confirmation;
let recaptcha;
let activeUser;
let firebaseInitialized = false;

function isFirebaseConfigured(){
  const config = window.kiranaFirebaseConfig;
  return config && [config.apiKey, config.authDomain, config.projectId, config.appId]
    .every(value => value && !value.startsWith("YOUR_"));
}

function setStatus(message){
  status.textContent = message;
}

function initializeFirebase(){
  if(firebaseInitialized && auth && database){
    return;
  }
  if(!isFirebaseConfigured()){
    return;
  }

  const app = getApps().length ? getApp() : initializeApp(window.kiranaFirebaseConfig);
  const appCheckSiteKey = window.kiranaFirebaseConfig.appCheckSiteKey;
  if(appCheckSiteKey && !appCheckSiteKey.startsWith("YOUR_")){
    if(!app.__kiranaAppCheckInitialized){
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true
      });
      app.__kiranaAppCheckInitialized = true;
    }
  }

  auth = getAuth(app);
  database = getFirestore(app);
  firebaseInitialized = true;
}

function resetOtp(){
  confirmation = null;
  otpForm.classList.add("hidden");
  phoneForm.classList.remove("hidden");
  document.getElementById("useAnotherPhone").classList.add("hidden");
  document.getElementById("reviewerOtp").value = "";
  setStatus("");
  if(recaptcha){
    recaptcha.clear();
    recaptcha = null;
  }
  document.getElementById("reviewerPhone").focus();
}

function createRequestCard(requestId, request){
  const card = document.createElement("article");
  card.className = "request-card";

  const heading = document.createElement("div");
  heading.className = "request-card-heading";
  const name = document.createElement("h3");
  name.textContent = request.name;
  heading.append(name);

  if(request.logo){
    const image = document.createElement("img");
    image.src = request.logo;
    image.alt = `${request.name} shop`;
    image.loading = "lazy";
    card.append(image);
  }
  card.append(heading);

  const details = document.createElement("dl");
  const fields = [
    ["Contact", request.phone],
    ["Owner login", request.ownerPhone || "Missing valid international phone number"],
    ["Address", request.address],
    ["Hours", `${request.openTime} – ${request.closeTime}`],
    ["Open days", request.openDays.join(", ")],
    ["Available items", request.items.join(", ")]
  ];
  for(const [label, value] of fields){
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    details.append(row);
  }
  card.append(details);

  const actions = document.createElement("div");
  actions.className = "request-actions";
  for(const [decision, label] of [["approved", "Verify and publish"], ["rejected", "Reject"]]){
    const button = document.createElement("button");
    button.type = "button";
    button.className = decision === "approved" ? "approve-request" : "reject-request";
    button.textContent = label;
    button.addEventListener("click", () => reviewRequest(requestId, request, decision, actions));
    actions.append(button);
  }
  card.append(actions);
  return card;
}

async function loadPendingRequests(){
  const pending = query(
    collection(database, "shopRequests"),
    where("status", "==", "pending"),
    limit(50)
  );
  const snapshot = await getDocs(pending);
  const requests = snapshot.docs.map(requestDocument => ({
    id: requestDocument.id,
    data: requestDocument.data()
  }));
  requests.sort((first, second) => (second.data.createdAt?.toMillis?.() || 0) - (first.data.createdAt?.toMillis?.() || 0));
  queue.replaceChildren();
  if(!requests.length){
    const message = document.createElement("p");
    message.className = "empty-requests";
    message.textContent = "There are no shop requests waiting for review.";
    queue.append(message);
    return;
  }
  for(const request of requests){
    queue.append(createRequestCard(request.id, request.data));
  }
}

async function reviewRequest(requestId, request, decision, actions){
  actions.querySelectorAll("button").forEach(button => { button.disabled = true; });
  setStatus(decision === "approved" ? "Publishing approved shop…" : "Rejecting shop request…");
  try{
    const requestReference = doc(database, "shopRequests", requestId);
    const shopReference = doc(database, "shops", requestId);
    await runTransaction(database, async transaction => {
      const currentRequest = await transaction.get(requestReference);
      if(!currentRequest.exists() || currentRequest.data().status !== "pending"){
        throw new Error("This shop request has already been reviewed.");
      }
      if(decision === "approved"){
        if(!/^\+[1-9][0-9]{7,14}$/.test(request.ownerPhone || "")){
          throw new Error("This request does not have an E.164 owner phone number.");
        }
        transaction.set(shopReference, {
          name: request.name,
          phone: request.phone,
          address: request.address,
          area: request.address,
          openTime: request.openTime,
          closeTime: request.closeTime,
          openDays: request.openDays,
          items: request.items,
          logo: request.logo,
          publishedAt: serverTimestamp()
        });
        transaction.set(doc(database, "shopOwners", requestId), {
          phone: request.ownerPhone,
          createdAt: serverTimestamp()
        });
      }
      transaction.update(requestReference, {
        status: decision,
        reviewedAt: serverTimestamp(),
        reviewedBy: activeUser.uid
      });
    });
  }catch(error){
    console.error("Could not review shop request:", error);
    setStatus(error.message === "This request does not have an E.164 owner phone number."
      ? "This request has no valid owner phone number. Ask the shop to submit again using an international (+country code) number."
      : "Could not update this request. Check your connection and admin permissions, then try again.");
    actions.querySelectorAll("button").forEach(button => { button.disabled = false; });
    return;
  }
  actions.closest(".request-card").remove();
  try{
    await loadPendingRequests();
    setStatus(decision === "approved" ? "Shop verified and published." : "Shop request rejected.");
  }catch(error){
    console.error("Could not refresh pending shop requests:", error);
    setStatus("The request was reviewed, but the queue could not refresh. Reload this page to see the latest requests.");
  }
}

document.getElementById("reviewerPhoneForm").addEventListener("submit", async event=>{
  event.preventDefault();
  const phone = document.getElementById("reviewerPhone").value.trim();
  const sendButton = document.getElementById("sendReviewerOtp");
  if(!phone){
    setStatus("Enter a valid phone number before requesting a code.");
    return;
  }
  sendButton.disabled = true;
  setStatus("");
  try{
    initializeFirebase();
    if(!auth){
      throw new Error("Firebase authentication is not available.");
    }
    if(recaptcha){
      recaptcha.clear();
    }
    recaptcha = new RecaptchaVerifier(auth, "reviewer-recaptcha", {size: "invisible"});
    confirmation = await signInWithPhoneNumber(auth, phone, recaptcha);
    phoneForm.classList.add("hidden");
    otpForm.classList.remove("hidden");
    document.getElementById("useAnotherPhone").classList.remove("hidden");
    document.getElementById("reviewerOtp").focus();
    setStatus("Verification code sent. Check your phone.");
  }catch(error){
    console.error("Could not send admin verification code:", error);
    if(recaptcha){
      recaptcha.clear();
      recaptcha = null;
    }
    setStatus("Could not send the verification code. Check the phone number and Firebase setup.");
  }finally{
    sendButton.disabled = false;
  }
});

document.getElementById("reviewerOtpForm").addEventListener("submit", async event=>{
  event.preventDefault();
  if(!confirmation) return;
  const button = document.getElementById("verifyReviewerOtp");
  button.disabled = true;
  try{
    await confirmation.confirm(document.getElementById("reviewerOtp").value.trim());
    confirmation = null;
  }catch(error){
    console.error("Could not verify admin phone:", error);
    setStatus("The verification code is invalid or expired. Please try again.");
  }finally{
    button.disabled = false;
  }
});

document.getElementById("useAnotherPhone").addEventListener("click", resetOtp);
document.getElementById("reviewerSignOut").addEventListener("click", async()=>{
  try{
    await signOut(auth);
    setStatus("You have signed out.");
  }catch(error){
    console.error("Could not sign out admin:", error);
    setStatus("Could not sign out. Please try again.");
  }
});

if(!isFirebaseConfigured()){
  setStatus("Admin login is not configured. Add Firebase web settings before using this page.");
}else{
  try{
    initializeFirebase();
    onAuthStateChanged(auth, async user=>{
      activeUser = user;
      if(!user){
        dashboard.classList.add("hidden");
        loginPanel.classList.remove("hidden");
        return;
      }
      setStatus("Checking admin permissions…");
      try{
        await loadPendingRequests();
        loginPanel.classList.add("hidden");
        dashboard.classList.remove("hidden");
        document.getElementById("reviewerIdentity").textContent = `Signed in as ${user.phoneNumber || "admin"}`;
        setStatus("");
      }catch(error){
        console.error("Admin access was denied:", error);
        await signOut(auth);
        setStatus("This phone number is not authorized to review requests. Ask the site administrator to add it to the admin allowlist.");
      }
    });
  }catch(error){
    console.error("Could not initialize admin login:", error);
    setStatus("Could not initialize Firebase. Check the Firebase web app configuration.");
  }
}
