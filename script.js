const shops = [
  {name:"Sri Lakshmi Stores", area:"Koramangala", phone:"919876543210", ownerPhone:"919876543210", openTime:"07:00", closeTime:"22:00", openDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], items:["Rice","Dal","Oil","Sugar","Biscuits","Milk"], logo:""},
  {name:"Namma Daily Needs", area:"HSR Layout", phone:"919812345678", ownerPhone:"919812345678", openTime:"08:00", closeTime:"21:30", openDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], items:["Groceries","Snacks","Beverages","Soap","Shampoo","Oil","Sugar","Biscuits","Milk"], logo:""},
  {name:"Ganesh Provision Store", area:"BTM Layout", phone:"919900112233", ownerPhone:"919900112233", openTime:"07:30", closeTime:"21:00", openDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], items:["Rice","Flour","Spices","Oil","Dry Fruits"], logo:""},
];

// Replace this number with the WhatsApp number that should receive shop-add requests.
const REQUEST_WHATSAPP = "919999999999";

const grid = document.getElementById("shopGrid");
const search = document.getElementById("searchInput");
const clear = document.getElementById("clearBtn");
const resultText = document.getElementById("resultText");
const empty = document.getElementById("emptyState");
const ownerLoginModal = document.getElementById("ownerLoginModal");
const ownerPhoneForm = document.getElementById("ownerPhoneForm");
const ownerOtpForm = document.getElementById("ownerOtpForm");
let language = "en";
let firebaseAuth = null;
let firebaseAuthSdk = null;
let otpConfirmation = null;
let recaptchaVerifier = null;

const translations = {
  en: {
    "Add Your Shop": "+ Add Your Shop",
    eyebrow: "LOCAL • SIMPLE • TRUSTED",
    heroTitle: 'Your neighborhood<br><span>kirana, online.</span>',
    heroDescription: "Discover nearby grocery shops, check what they offer, and contact them directly on WhatsApp.",
    searchPlaceholder: "Search shops, items or area...",
    shopCount: "shops",
    localBusinesses: "Local businesses",
    whatsappOrdering: "WhatsApp ordering",
    directory: "SHOP DIRECTORY",
    availableShops: "Available shops",
    noShops: "No shops found",
    trySearch: "Try another shop name, item or area.",
    growBusiness: "GROW YOUR LOCAL BUSINESS",
    ownShop: "Own a Kirana shop?",
    addDescription: "Add your shop to this directory. No app or website is required — just send your details through WhatsApp.",
    requestAdd: "Request to add my shop",
    footer: "Made for local businesses",
    joinDirectory: "JOIN THE DIRECTORY",
    modalTitle: "Add your shop",
    modalSub: "Enter your shop details. We'll prepare a WhatsApp message for you.",
    view: "View",
    viewStock: "View stock details",
    stockDetails: "STOCK DETAILS",
    stockAvailable: "Available",
    stockCount: n => `${n} items listed`,
    itemsEtc: "Etc.",
    formLabels: ["Shop name", "Shop image", "Contact number", "Shop address", "Opens at", "Closes at", "Available items"],
    imageOptional: "(optional, max 5 MB)",
    imageStatus: "Choose an image file (max 5 MB)",
    imageTooLarge: "Image must be 5 MB or smaller.",
    imageTypeError: "Choose a valid image file.",
    daily: "Daily",
    openDaysLabel: "Open days",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    selectDayError: "Select at least one open day.",
    attachImage: "Please attach the selected shop image in this WhatsApp chat.",
    submit: "◉ Send request on WhatsApp",
    formNote: "Your details are not stored by this website.",
    close: "Close",
    clear: "Clear search",
    openDaily: "● Open daily",
    whatsapp: "WhatsApp",
    call: "Call",
    visitStore: "Visit store",
    ownerLogin: "Shop owner login",
    ownerLoginDescription: "Verify your shop phone number to open its profile.",
    ownerPhone: "Phone number (+country code)",
    sendOtp: "Send OTP",
    otpCode: "6-digit code",
    verifyOtp: "Verify and open profile",
    useAnotherPhone: "Use another number",
    otpSent: "Verification code sent. Check your phone.",
    otpSendFailed: "Could not send the code. Check the number and Firebase setup, then try again.",
    otpVerifyFailed: "That code could not be verified. Check it and try again.",
    phoneNotMapped: "This verified number is not linked to a shop profile.",
    firebaseNotConfigured: "Phone login is not configured yet. Add your Firebase web settings and enable Phone sign-in.",
    profileContact: "Verified phone",
    signOut: "Sign out",
    result: n => `${n} shop${n === 1 ? "" : "s"} found`
  },
  kn: {
    "Add Your Shop": "+ ನಿಮ್ಮ ಅಂಗಡಿ ಸೇರಿಸಿ",
    eyebrow: "ಸ್ಥಳೀಯ • ಸರಳ • ವಿಶ್ವಾಸಾರ್ಹ",
    heroTitle: 'ನಿಮ್ಮ ನೆರೆಹೊರೆಯ<br><span>ಕಿರಾಣಿ ಅಂಗಡಿ, ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ.</span>',
    heroDescription: "ಹತ್ತಿರದ ಕಿರಾಣಿ ಅಂಗಡಿಗಳನ್ನು ಹುಡುಕಿ, ಅವುಗಳ ಉತ್ಪನ್ನಗಳನ್ನು ನೋಡಿ, ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ.",
    searchPlaceholder: "ಅಂಗಡಿ, ವಸ್ತು ಅಥವಾ ಪ್ರದೇಶ ಹುಡುಕಿ...",
    shopCount: "ಅಂಗಡಿಗಳು",
    localBusinesses: "ಸ್ಥಳೀಯ ವ್ಯಾಪಾರಗಳು",
    whatsappOrdering: "ವಾಟ್ಸಾಪ್ ಆರ್ಡರ್",
    directory: "ಅಂಗಡಿಗಳ ಪಟ್ಟಿ",
    availableShops: "ಲಭ್ಯವಿರುವ ಅಂಗಡಿಗಳು",
    noShops: "ಯಾವುದೇ ಅಂಗಡಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ",
    trySearch: "ಬೇರೆ ಅಂಗಡಿ ಹೆಸರು, ವಸ್ತು ಅಥವಾ ಪ್ರದೇಶ ಹುಡುಕಿ.",
    growBusiness: "ನಿಮ್ಮ ಸ್ಥಳೀಯ ವ್ಯಾಪಾರ ಬೆಳೆಸಿ",
    ownShop: "ನಿಮ್ಮದೇ ಕಿರಾಣಿ ಅಂಗಡಿ ಇದೆಯೇ?",
    addDescription: "ಈ ಪಟ್ಟಿಗೆ ನಿಮ್ಮ ಅಂಗಡಿಯನ್ನು ಸೇರಿಸಿ. ಆಪ್ ಅಥವಾ ವೆಬ್‌ಸೈಟ್ ಅಗತ್ಯವಿಲ್ಲ; ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ವಿವರಗಳನ್ನು ಕಳುಹಿಸಿ.",
    requestAdd: "ನನ್ನ ಅಂಗಡಿ ಸೇರಿಸಲು ವಿನಂತಿಸಿ",
    footer: "ಸ್ಥಳೀಯ ವ್ಯಾಪಾರಗಳಿಗಾಗಿ",
    joinDirectory: "ಅಂಗಡಿಗಳ ಪಟ್ಟಿಗೆ ಸೇರಿ",
    modalTitle: "ನಿಮ್ಮ ಅಂಗಡಿ ಸೇರಿಸಿ",
    modalSub: "ನಿಮ್ಮ ಅಂಗಡಿ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ. ನಿಮಗಾಗಿ ವಾಟ್ಸಾಪ್ ಸಂದೇಶವನ್ನು ಸಿದ್ಧಪಡಿಸುತ್ತೇವೆ.",
    view: "ವೀಕ್ಷಿಸಿ",
    viewStock: "ಸ್ಟಾಕ್ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    stockDetails: "ಸ್ಟಾಕ್ ವಿವರಗಳು",
    stockAvailable: "ಲಭ್ಯವಿದೆ",
    stockCount: n => `${n} ವಸ್ತುಗಳ ಪಟ್ಟಿ`,
    itemsEtc: "ಇತ್ಯಾದಿ",
    formLabels: ["ಅಂಗಡಿಯ ಹೆಸರು", "ಅಂಗಡಿಯ ಚಿತ್ರ", "ಸಂಪರ್ಕ ಸಂಖ್ಯೆ", "ಅಂಗಡಿಯ ವಿಳಾಸ", "ತೆರೆಯುವ ಸಮಯ", "ಮುಚ್ಚುವ ಸಮಯ", "ಲಭ್ಯವಿರುವ ವಸ್ತುಗಳು"],
    imageOptional: "(ಐಚ್ಛಿಕ, ಗರಿಷ್ಠ 5 MB)",
    imageStatus: "ಚಿತ್ರ ಆಯ್ಕೆಮಾಡಿ (ಗರಿಷ್ಠ 5 MB)",
    imageTooLarge: "ಚಿತ್ರವು 5 MB ಅಥವಾ ಅದಕ್ಕಿಂತ ಕಡಿಮೆ ಇರಬೇಕು.",
    imageTypeError: "ಸರಿಯಾದ ಚಿತ್ರ ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ.",
    daily: "ಪ್ರತಿದಿನ",
    openDaysLabel: "ತೆರೆದಿರುವ ದಿನಗಳು",
    days: ["ಸೋಮ", "ಮಂಗಳ", "ಬುಧ", "ಗುರು", "ಶುಕ್ರ", "ಶನಿ", "ಭಾನು"],
    selectDayError: "ಕನಿಷ್ಠ ಒಂದು ದಿನವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    attachImage: "ಈ ವಾಟ್ಸಾಪ್ ಚಾಟ್‌ನಲ್ಲಿ ಆಯ್ಕೆ ಮಾಡಿದ ಅಂಗಡಿಯ ಚಿತ್ರವನ್ನು ಲಗತ್ತಿಸಿ.",
    submit: "◉ ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ವಿನಂತಿ ಕಳುಹಿಸಿ",
    formNote: "ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಈ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ.",
    close: "ಮುಚ್ಚಿ",
    clear: "ಹುಡುಕಾಟ ತೆರವುಗೊಳಿಸಿ",
    openDaily: "● ಪ್ರತಿದಿನ ತೆರೆದಿರುತ್ತದೆ",
    whatsapp: "ವಾಟ್ಸಾಪ್",
    call: "ಕರೆ",
    visitStore: "ಅಂಗಡಿಗೆ ಭೇಟಿ",
    ownerLogin: "ಅಂಗಡಿ ಮಾಲೀಕರ ಲಾಗಿನ್",
    ownerLoginDescription: "ಪ್ರೊಫೈಲ್ ತೆರೆಯಲು ನಿಮ್ಮ ಅಂಗಡಿಯ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    ownerPhone: "ಫೋನ್ ಸಂಖ್ಯೆ (+ದೇಶದ ಕೋಡ್)",
    sendOtp: "OTP ಕಳುಹಿಸಿ",
    otpCode: "6 ಅಂಕಿಯ ಕೋಡ್",
    verifyOtp: "ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಪ್ರೊಫೈಲ್ ತೆರೆಯಿರಿ",
    useAnotherPhone: "ಬೇರೆ ಸಂಖ್ಯೆಯನ್ನು ಬಳಸಿ",
    otpSent: "ಪರಿಶೀಲನಾ ಕೋಡ್ ಕಳುಹಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಫೋನ್ ಪರಿಶೀಲಿಸಿ.",
    otpSendFailed: "ಕೋಡ್ ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ. ಸಂಖ್ಯೆ ಮತ್ತು Firebase ಸೆಟಪ್ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    otpVerifyFailed: "ಕೋಡ್ ಪರಿಶೀಲಿಸಲಾಗಲಿಲ್ಲ. ಸರಿಯಾದ ಕೋಡ್ ನಮೂದಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    phoneNotMapped: "ಈ ಪರಿಶೀಲಿಸಿದ ಸಂಖ್ಯೆಗೆ ಅಂಗಡಿ ಪ್ರೊಫೈಲ್ ಜೋಡಿಸಲಾಗಿಲ್ಲ.",
    firebaseNotConfigured: "ಫೋನ್ ಲಾಗಿನ್ ಇನ್ನೂ ಹೊಂದಿಸಿಲ್ಲ. Firebase ವೆಬ್ ಸೆಟ್ಟಿಂಗ್ ಸೇರಿಸಿ ಮತ್ತು Phone sign-in ಸಕ್ರಿಯಗೊಳಿಸಿ.",
    profileContact: "ಪರಿಶೀಲಿಸಿದ ಫೋನ್",
    signOut: "ಲಾಗ್ ಔಟ್",
    result: n => `${n} ಅಂಗಡಿ${n === 1 ? "" : "ಗಳು"} ಕಂಡುಬಂದಿವೆ`
  }
};

function applyLanguage(){
  const text = translations[language];
  const setText = (selector, value) => { document.querySelector(selector).textContent = value; };
  document.documentElement.lang = language === "kn" ? "kn" : "en";
  document.getElementById("languageToggle").textContent = language === "en" ? "ಕನ್ನಡ" : "English";
  document.getElementById("languageToggle").setAttribute("aria-label", language === "en" ? "Switch language to Kannada" : "ಭಾಷೆಯನ್ನು ಇಂಗ್ಲಿಷ್‌ಗೆ ಬದಲಾಯಿಸಿ");
  document.querySelector(".nav-add").textContent = text["Add Your Shop"];
  setText(".eyebrow", text.eyebrow);
  document.querySelector(".hero h1").innerHTML = text.heroTitle;
  setText(".hero-copy>p", text.heroDescription);
  search.placeholder = text.searchPlaceholder;
  document.querySelector(".hero-stats span:first-child").innerHTML = `<b id="shopCount">${shops.length}</b> ${text.shopCount}`;
  document.querySelector(".hero-stats span:nth-of-type(2)").textContent = text.localBusinesses;
  document.querySelector(".hero-stats span:nth-of-type(3)").textContent = text.whatsappOrdering;
  setText(".directory .kicker", text.directory);
  setText(".section-heading h2", text.availableShops);
  setText(".empty h3", text.noShops);
  setText(".empty p", text.trySearch);
  setText(".add-section .kicker", text.growBusiness);
  setText(".add-section h2", text.ownShop);
  setText(".add-section p:not(.kicker)", text.addDescription);
  document.querySelector(".primary-btn").innerHTML = `${text.requestAdd} <span>→</span>`;
  document.querySelector(".footer-inner span:last-child").textContent = text.footer;
  setText(".modal-box .kicker", text.joinDirectory);
  setText("#modalTitle", text.modalTitle);
  setText(".modal-sub", text.modalSub);
  setText("#stockModalKicker", text.stockDetails);
  document.querySelectorAll("#shopForm > label, #shopForm > .two-col > label").forEach((label, index) => {
    label.childNodes[0].textContent = text.formLabels[index];
  });
  document.querySelector(".day-picker legend").textContent = text.openDaysLabel;
  document.querySelectorAll(".day-options label").forEach((label, index) => {
    label.lastChild.textContent = ` ${text.days[index]}`;
  });
  document.querySelector("#shopForm label span").textContent = text.imageOptional;
  document.getElementById("logoStatus").textContent = document.getElementById("shopImage").files[0]?.name || text.imageStatus;
  document.querySelector(".whatsapp-btn").innerHTML = text.submit;
  setText(".form-note", text.formNote);
  document.querySelector(".modal-close").setAttribute("aria-label", text.close);
  document.querySelector("#stockModal .modal-close").setAttribute("aria-label", text.close);
  document.getElementById("ownerLoginButton").textContent = text.ownerLogin;
  document.getElementById("ownerLoginTitle").textContent = text.ownerLogin;
  document.getElementById("ownerLoginDescription").textContent = text.ownerLoginDescription;
  document.getElementById("ownerPhoneLabel").textContent = text.ownerPhone;
  document.getElementById("ownerOtpLabel").textContent = text.otpCode;
  document.getElementById("sendOtpButton").textContent = text.sendOtp;
  document.getElementById("verifyOtpButton").textContent = text.verifyOtp;
  document.getElementById("ownerBackButton").textContent = text.useAnotherPhone;
  document.getElementById("ownerSignOutButton").textContent = text.signOut;
  clear.setAttribute("aria-label", text.clear);
  doSearch();
}

document.getElementById("languageToggle").addEventListener("click", () => {
  language = language === "en" ? "kn" : "en";
  applyLanguage();
});

function initials(name){ return name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase(); }

function formatTime(value){
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatFormTime(hour, minute, period){
  const hour24 = Number(hour) % 12 + (period === "PM" ? 12 : 0);
  return formatTime(`${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
}

function formatDailyHours(shop){
  const days = formatScheduleDays(shop.openDays);
  return `${days} · ${formatTime(shop.openTime)} – ${formatTime(shop.closeTime)}`;
}

function formatScheduleDays(days){
  const orderedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].filter(day => days.includes(day));
  if(orderedDays.length === 7) return translations[language].daily;
  return orderedDays.map(day => translations[language].days[["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(day)]).join(", ");
}

function render(list){
  grid.innerHTML = "";
  list.forEach(shop => {
    const logo = shop.logo
      ? `<img src="${escapeAttr(shop.logo)}" alt="${escapeAttr(shop.name)} logo">`
      : initials(shop.name);
    const wa = `https://wa.me/${shop.phone}?text=${encodeURIComponent("Hi " + shop.name)}`;
    const destination = encodeURIComponent(`${shop.name}, ${shop.address || shop.area}`);
    const route = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving&dir_action=navigate`;
    const itemPreview = shop.items.slice(0, 5).map(item => `<span class="item">${escapeHtml(item)}</span>`).join("");
    const moreItems = shop.items.length > 5 ? `<span class="item item-more">${translations[language].itemsEtc}</span>` : "";
    grid.insertAdjacentHTML("beforeend", `
      <article class="shop-card">
        <div class="shop-top">
          <div class="shop-logo">${logo}</div>
          <div>
            <div class="shop-heading"><h3 class="shop-name">${escapeHtml(shop.name)}</h3><button type="button" class="view-stock-btn" data-stock-index="${shops.indexOf(shop)}" aria-label="${escapeAttr(`${translations[language].viewStock}: ${shop.name}`)}">${translations[language].view}</button></div>
            <div class="shop-area">${escapeHtml(shop.address || shop.area)}</div>
            <span class="badge">${translations[language].openDaily}</span>
          </div>
        </div>
        <div class="info-row"><span class="info-icon">◷</span><span>${escapeHtml(formatDailyHours(shop))}</span></div>
        <div class="items">${itemPreview}${moreItems}</div>
        <div class="shop-actions">
          <a class="action primary" href="${wa}" target="_blank" rel="noopener">${translations[language].whatsapp}</a>
          <a class="action" href="tel:+${shop.phone}">${translations[language].call}</a>
          <a class="action" href="${route}" target="_blank" rel="noopener noreferrer" aria-label="${escapeAttr(`${translations[language].visitStore}: ${shop.name}`)}">${translations[language].visitStore}</a>
        </div>
      </article>
    `);
  });
  document.getElementById("shopCount").textContent = shops.length;
  resultText.textContent = list.length ? translations[language].result(list.length) : "";
  empty.classList.toggle("hidden", list.length !== 0);
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function escapeAttr(s){return escapeHtml(s)}

function doSearch(){
  const q = search.value.trim().toLowerCase();
  clear.style.display = q ? "block" : "none";
  if(!q){ render(shops); return; }
  render(shops.filter(s => [s.name,s.area,formatDailyHours(s),...s.items].join(" ").toLowerCase().includes(q)));
}
search.addEventListener("input", doSearch);
grid.addEventListener("click", event=>{
  const button = event.target.closest(".view-stock-btn");
  if(button) openStockModal(Number(button.dataset.stockIndex));
});
clear.addEventListener("click",()=>{search.value="";doSearch();search.focus();});
render(shops);

const modal = document.getElementById("modal");
const stockModal = document.getElementById("stockModal");
function openModal(){modal.classList.remove("hidden");document.body.style.overflow="hidden";setTimeout(()=>document.querySelector("#shopForm input").focus(),50)}
function closeModal(){modal.classList.add("hidden");document.body.style.overflow=""}
function openStockModal(index){
  const shop = shops[index];
  if(!shop) return;
  document.getElementById("stockModalTitle").textContent = shop.name;
  document.getElementById("stockModalSummary").textContent = `${shop.address || shop.area} · ${formatDailyHours(shop)} · ${translations[language].stockCount(shop.items.length)}`;
  document.getElementById("stockItems").innerHTML = shop.items.map(item => `<li><span>${escapeHtml(item)}</span><span class="stock-status">${translations[language].stockAvailable}</span></li>`).join("");
  stockModal.classList.remove("hidden");
  document.body.style.overflow="hidden";
  document.querySelector("#stockModal .modal-close").focus();
}
function closeStockModal(){stockModal.classList.add("hidden");if(modal.classList.contains("hidden"))document.body.style.overflow=""}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();closeStockModal()}});

function setOwnerLoginStatus(message){
  document.getElementById("ownerLoginStatus").textContent = message;
}

function isFirebaseConfigured(){
  const config = window.kiranaFirebaseConfig;
  return config && [config.apiKey, config.authDomain, config.projectId, config.appId].every(value => value && !value.startsWith("YOUR_"));
}

async function initializeFirebaseAuth(){
  if(firebaseAuth) return;
  const appSdk = await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js");
  firebaseAuthSdk = await import("https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js");
  const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(window.kiranaFirebaseConfig);
  firebaseAuth = firebaseAuthSdk.getAuth(app);
}

function clearOwnerOtpState(){
  otpConfirmation = null;
  ownerOtpForm.classList.add("hidden");
  ownerPhoneForm.classList.remove("hidden");
  document.getElementById("ownerBackButton").classList.add("hidden");
  document.getElementById("ownerProfile").classList.add("hidden");
  document.getElementById("ownerOtp").value = "";
  setOwnerLoginStatus("");
  if(recaptchaVerifier){
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
}

document.getElementById("ownerLoginButton").addEventListener("click",()=>{
  clearOwnerOtpState();
  ownerLoginModal.classList.remove("hidden");
  document.body.style.overflow="hidden";
  document.getElementById("ownerPhone").focus();
});
document.querySelectorAll("[data-close-owner-login]").forEach(button=>button.addEventListener("click",()=>{
  ownerLoginModal.classList.add("hidden");
  if(modal.classList.contains("hidden") && stockModal.classList.contains("hidden")) document.body.style.overflow="";
}));

ownerPhoneForm.addEventListener("submit",async event=>{
  event.preventDefault();
  const phone = document.getElementById("ownerPhone").value.trim();
  const text = translations[language];
  const sendButton = document.getElementById("sendOtpButton");
  if(!isFirebaseConfigured()){
    setOwnerLoginStatus(text.firebaseNotConfigured);
    return;
  }
  sendButton.disabled = true;
  try{
    await initializeFirebaseAuth();
    recaptchaVerifier = new firebaseAuthSdk.RecaptchaVerifier(firebaseAuth,"recaptcha-container",{size:"invisible"});
    otpConfirmation = await firebaseAuthSdk.signInWithPhoneNumber(firebaseAuth,phone,recaptchaVerifier);
    ownerPhoneForm.classList.add("hidden");
    ownerOtpForm.classList.remove("hidden");
    document.getElementById("ownerBackButton").classList.remove("hidden");
    setOwnerLoginStatus(text.otpSent);
    document.getElementById("ownerOtp").focus();
  }catch(error){
    if(recaptchaVerifier){recaptchaVerifier.clear();recaptchaVerifier=null;}
    setOwnerLoginStatus(text.otpSendFailed);
  }finally{
    sendButton.disabled = false;
  }
});

ownerOtpForm.addEventListener("submit",async event=>{
  event.preventDefault();
  if(!otpConfirmation) return;
  const verifyButton = document.getElementById("verifyOtpButton");
  verifyButton.disabled = true;
  try{
    const credential = await otpConfirmation.confirm(document.getElementById("ownerOtp").value.trim());
    const verifiedDigits = credential.user.phoneNumber.replace(/\D/g,"");
    const shop = shops.find(entry=>(entry.ownerPhone || "").replace(/\D/g,"") === verifiedDigits);
    if(!shop){
      await firebaseAuthSdk.signOut(firebaseAuth);
      setOwnerLoginStatus(translations[language].phoneNotMapped);
      return;
    }
    document.getElementById("ownerProfileName").textContent = shop.name;
    document.getElementById("ownerProfileAddress").textContent = shop.address || shop.area;
    document.getElementById("ownerProfileContact").textContent = `${translations[language].profileContact}: ${credential.user.phoneNumber}`;
    document.getElementById("ownerProfile").classList.remove("hidden");
    document.getElementById("ownerSignOutButton").classList.remove("hidden");
    ownerOtpForm.classList.add("hidden");
    document.getElementById("ownerBackButton").classList.add("hidden");
    setOwnerLoginStatus("");
  }catch(error){
    setOwnerLoginStatus(translations[language].otpVerifyFailed);
  }finally{
    verifyButton.disabled = false;
  }
});

document.getElementById("ownerBackButton").addEventListener("click",clearOwnerOtpState);
document.getElementById("ownerSignOutButton").addEventListener("click",async()=>{
  if(firebaseAuth && firebaseAuthSdk) await firebaseAuthSdk.signOut(firebaseAuth);
  document.getElementById("ownerSignOutButton").classList.add("hidden");
  clearOwnerOtpState();
});

document.getElementById("shopForm").addEventListener("submit", e=>{
  e.preventDefault();
  const image = document.getElementById("shopImage").files[0];
  if(image && !image.type.startsWith("image/")){
    document.getElementById("logoStatus").textContent = translations[language].imageTypeError;
    return;
  }
  if(image && image.size > 5 * 1024 * 1024){
    document.getElementById("logoStatus").textContent = translations[language].imageTooLarge;
    return;
  }
  const data = Object.fromEntries(new FormData(e.target));
  const opening = formatFormTime(data.openHour, data.openMinute, data.openPeriod);
  const closing = formatFormTime(data.closeHour, data.closeMinute, data.closePeriod);
  const formData = new FormData(e.target);
  const openDays = formData.getAll("openDays");
  if(!openDays.length){
    document.getElementById("dayError").textContent = translations[language].selectDayError;
    return;
  }
  document.getElementById("dayError").textContent = "";
  const msg = `*Request to Add My Kirana Shop*\n\n*Shop name:* ${data.shop}\n*Shop image:* ${image ? image.name : "Not provided"}\n${image ? translations[language].attachImage + "\n" : ""}*Contact:* ${data.contact}\n*Address:* ${data.address}\n*Available items:* ${data.items}\n*Open days:* ${formatScheduleDays(openDays)}\n*Shop hours:* ${opening} – ${closing}`;
  window.open(`https://wa.me/${REQUEST_WHATSAPP}?text=${encodeURIComponent(msg)}`,"_blank","noopener");
});

document.querySelectorAll("input[name='openDays']").forEach(input=>{
  input.addEventListener("change",()=>{ document.getElementById("dayError").textContent = ""; });
});

document.getElementById("shopImage").addEventListener("change", event=>{
  const image = event.target.files[0];
  const status = document.getElementById("logoStatus");
  if(!image){ status.textContent = translations[language].imageStatus; return; }
  if(!image.type.startsWith("image/")){
    event.target.value = "";
    status.textContent = translations[language].imageTypeError;
    return;
  }
  if(image.size > 5 * 1024 * 1024){
    event.target.value = "";
    status.textContent = translations[language].imageTooLarge;
    return;
  }
  status.textContent = image.name;
});
