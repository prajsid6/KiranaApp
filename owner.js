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
  getDoc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const loginPanel = document.getElementById("ownerLoginPanel");
const phoneForm = document.getElementById("ownerPhoneForm");
const otpForm = document.getElementById("ownerOtpForm");
const dashboard = document.getElementById("ownerDashboard");
const shopsContainer = document.getElementById("ownedShops");
const status = document.getElementById("ownerStatus");
let auth;
let database;
let confirmation;
let recaptcha;
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
  if(firebaseInitialized && auth && database) return;
  if(!isFirebaseConfigured()) return;

  const app = getApps().length ? getApp() : initializeApp(window.kiranaFirebaseConfig);
  const appCheckSiteKey = window.kiranaFirebaseConfig.appCheckSiteKey;
  if(appCheckSiteKey && !appCheckSiteKey.startsWith("YOUR_") && !app.__kiranaAppCheckInitialized){
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true
    });
    app.__kiranaAppCheckInitialized = true;
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
  document.getElementById("ownerOtp").value = "";
  if(recaptcha){
    recaptcha.clear();
    recaptcha = null;
  }
}

function createShopEditor(shopId, shop){
  const card = document.createElement("article");
  card.className = "owner-shop-card";

  const heading = document.createElement("h3");
  heading.textContent = shop.name;
  card.append(heading);

  const form = document.createElement("form");
  form.className = "shop-editor";
  const fields = [
    ["Shop name", "name", shop.name, "text"],
    ["Contact number (digits only)", "phone", shop.phone, "tel"],
    ["Shop address", "address", shop.address, "text"],
    ["Opening time", "openTime", shop.openTime, "time"],
    ["Closing time", "closeTime", shop.closeTime, "time"]
  ];
  for(const [labelText, name, value, type] of fields){
    const label = document.createElement("label");
    label.textContent = labelText;
    const input = document.createElement("input");
    input.name = name;
    input.type = type;
    input.value = value || "";
    input.required = true;
    if(name === "name") input.maxLength = 100;
    if(name === "phone"){
      input.inputMode = "numeric";
      input.pattern = "[0-9]{8,20}";
      input.maxLength = 20;
    }
    if(name === "address") input.maxLength = 300;
    label.append(input);
    form.append(label);
  }

  const daysFieldset = document.createElement("fieldset");
  daysFieldset.className = "day-picker";
  const legend = document.createElement("legend");
  legend.textContent = "Open days";
  daysFieldset.append(legend);
  const days = document.createElement("div");
  days.className = "day-options";
  const selectedDays = new Set(shop.openDays || []);
  for(const day of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]){
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "openDays";
    checkbox.value = day;
    checkbox.checked = selectedDays.has(day);
    label.append(checkbox, document.createTextNode(` ${day}`));
    days.append(label);
  }
  daysFieldset.append(days);
  form.append(daysFieldset);

  const itemsLabel = document.createElement("label");
  itemsLabel.textContent = "Available items (comma or newline separated)";
  const items = document.createElement("textarea");
  items.name = "items";
  items.rows = 4;
  items.required = true;
  items.value = (shop.items || []).join(", ");
  itemsLabel.append(items);
  form.append(itemsLabel);

  const save = document.createElement("button");
  save.type = "submit";
  save.className = "primary-btn save-shop-btn";
  save.textContent = "Save shop details";
  form.append(save);

  const feedback = document.createElement("p");
  feedback.className = "shop-save-status";
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const formData = new FormData(form);
    const openDays = formData.getAll("openDays");
    const itemList = String(formData.get("items") || "")
      .split(/[,\n]+/)
      .map(item => item.trim())
      .filter(Boolean);
    if(!openDays.length){
      feedback.textContent = "Select at least one open day.";
      return;
    }
    if(!itemList.length){
      feedback.textContent = "Add at least one available item.";
      return;
    }
    if(itemList.length > 40){
      feedback.textContent = "List no more than 40 available items.";
      return;
    }
    save.disabled = true;
    feedback.textContent = "Saving shop details…";
    try{
      await updateDoc(doc(database, "shops", shopId), {
        name: String(formData.get("name")).trim(),
        phone: String(formData.get("phone")).trim(),
        address: String(formData.get("address")).trim(),
        area: String(formData.get("address")).trim(),
        openTime: String(formData.get("openTime")),
        closeTime: String(formData.get("closeTime")),
        openDays,
        items: itemList
      });
      heading.textContent = String(formData.get("name")).trim();
      feedback.textContent = "Shop details saved.";
    }catch(error){
      console.error("Could not save shop details:", error);
      feedback.textContent = "Could not save changes. Check your connection and try again.";
    }finally{
      save.disabled = false;
    }
  });
  form.append(feedback);
  card.append(form);
  return card;
}

async function loadOwnedShops(user){
  const assignmentsQuery = query(
    collection(database, "shopOwners"),
    where("phone", "==", user.phoneNumber)
  );
  const assignments = await getDocs(assignmentsQuery);
  if(assignments.empty){
    throw new Error("No approved shop is assigned to this phone number.");
  }
  const shops = await Promise.all(assignments.docs.map(async assignment => {
    const shop = await getDoc(doc(database, "shops", assignment.id));
    if(!shop.exists()){
      throw new Error(`Assigned shop ${assignment.id} is missing.`);
    }
    return createShopEditor(shop.id, shop.data());
  }));
  shopsContainer.replaceChildren(...shops);
}

document.getElementById("ownerPhoneForm").addEventListener("submit", async event=>{
  event.preventDefault();
  const phone = document.getElementById("ownerPhone").value.trim();
  const sendButton = document.getElementById("sendOwnerOtp");
  sendButton.disabled = true;
  setStatus("");
  try{
    initializeFirebase();
    if(!auth) throw new Error("Firebase authentication is not available.");
    if(recaptcha) recaptcha.clear();
    recaptcha = new RecaptchaVerifier(auth, "owner-recaptcha", {size: "invisible"});
    confirmation = await signInWithPhoneNumber(auth, phone, recaptcha);
    phoneForm.classList.add("hidden");
    otpForm.classList.remove("hidden");
    document.getElementById("useAnotherPhone").classList.remove("hidden");
    document.getElementById("ownerOtp").focus();
    setStatus("Verification code sent. Check your phone.");
  }catch(error){
    console.error("Could not send shop owner verification code:", error);
    if(recaptcha){
      recaptcha.clear();
      recaptcha = null;
    }
    setStatus("Could not send the verification code. Check the phone number and Firebase setup.");
  }finally{
    sendButton.disabled = false;
  }
});

document.getElementById("ownerOtpForm").addEventListener("submit", async event=>{
  event.preventDefault();
  if(!confirmation) return;
  const button = document.getElementById("verifyOwnerOtp");
  button.disabled = true;
  try{
    await confirmation.confirm(document.getElementById("ownerOtp").value.trim());
    confirmation = null;
  }catch(error){
    console.error("Could not verify shop owner phone:", error);
    setStatus("The verification code is invalid or expired. Please try again.");
  }finally{
    button.disabled = false;
  }
});

document.getElementById("useAnotherPhone").addEventListener("click", resetOtp);
document.getElementById("ownerSignOut").addEventListener("click", async()=>{
  try{
    await signOut(auth);
    setStatus("You have signed out.");
  }catch(error){
    console.error("Could not sign out shop owner:", error);
    setStatus("Could not sign out. Please try again.");
  }
});

if(!isFirebaseConfigured()){
  setStatus("Shop owner login is not configured. Add Firebase web settings before using this page.");
}else{
  try{
    initializeFirebase();
    onAuthStateChanged(auth, async user=>{
      if(!user){
        dashboard.classList.add("hidden");
        loginPanel.classList.remove("hidden");
        shopsContainer.replaceChildren();
        return;
      }
      setStatus("Checking shop owner access…");
      try{
        await loadOwnedShops(user);
        loginPanel.classList.add("hidden");
        dashboard.classList.remove("hidden");
        document.getElementById("ownerIdentity").textContent = `Signed in as ${user.phoneNumber || "shop owner"}`;
        setStatus("");
      }catch(error){
        console.error("Shop owner access was denied:", error);
        await signOut(auth);
        setStatus("No approved shop is assigned to this phone number. Use the number submitted with your shop request.");
      }
    });
  }catch(error){
    console.error("Could not initialize shop owner login:", error);
    setStatus("Could not initialize Firebase. Check the Firebase web app configuration.");
  }
}
