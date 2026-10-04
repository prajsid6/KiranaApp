const initialShops = [
  {name:"Sri Lakshmi Stores", area:"Koramangala", phone:"919876543210", openTime:"07:00", closeTime:"22:00", openDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], items:["Rice","Dal","Oil","Sugar","Biscuits","Milk"], logo:""},
  {name:"Namma Daily Needs", area:"HSR Layout", phone:"919812345678", openTime:"08:00", closeTime:"21:30", openDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], items:["Groceries","Snacks","Beverages","Soap","Shampoo","Oil","Sugar","Biscuits","Milk"], logo:""},
  {name:"Ganesh Provision Store", area:"BTM Layout", phone:"919900112233", openTime:"07:30", closeTime:"21:00", openDays:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], items:["Rice","Flour","Spices","Oil","Dry Fruits"], logo:""},
];

const grid = document.getElementById("shopGrid");
const search = document.getElementById("searchInput");
const clear = document.getElementById("clearBtn");
const resultText = document.getElementById("resultText");
const empty = document.getElementById("emptyState");
let language = "en";
let firebaseApp = null;
let firestore = null;
let storage = null;
let firestoreSdk = null;
let storageSdk = null;
let shops = [...initialShops];

const translations = {
  en: {
    ownerLogin: "Shop owner login",
    adminLogin: "Admin login",
    requestAdd: "Request to add my shop",
    requestPending: "Submit shop for admin review",
    requestSuccess: "Your shop request was submitted. It will appear after admin approval.",
    requestFailed: "Could not submit your request. Please try again.",
    firebaseNotConfigured: "Shop request submission is not configured yet. Please contact the site administrator.",
    directoryNotConfigured: "Online publishing is not configured. Showing featured shops.",
    directoryLoadFailed: "Approved listings could not be loaded. Showing featured shops.",
    eyebrow: "LOCAL • SIMPLE • TRUSTED",
    marquee: ["Your neighborhood, your market", "Fresh essentials, every day", "Small shops. Big heart.", "Local stores, stronger communities", "Every purchase keeps local thriving", "Trusted service around the corner"],
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
    addDescription: "Submit your shop details for review. Approved shops are published in this directory.",
    footer: "Made for local businesses, and the people who love them.",
    joinDirectory: "JOIN THE DIRECTORY",
    modalTitle: "Add your shop",
    modalSub: "Submit your details for admin review. After approval, manage your shop with the same phone number.",
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
    formNote: "Shop requests are stored securely and reviewed before publication.",
    close: "Close",
    clear: "Clear search",
    openDaily: "● Open daily",
    whatsapp: "WhatsApp",
    call: "Call",
    visitStore: "Visit store",
    result: n => `${n} shop${n === 1 ? "" : "s"} found`
  },
  kn: {
    ownerLogin: "ಅಂಗಡಿ ಮಾಲೀಕರ ಲಾಗಿನ್",
    adminLogin: "ನಿರ್ವಾಹಕ ಲಾಗಿನ್",
    requestAdd: "ನನ್ನ ಅಂಗಡಿ ಸೇರಿಸಲು ವಿನಂತಿಸಿ",
    requestPending: "ನಿರ್ವಾಹಕರ ಪರಿಶೀಲನೆಗಾಗಿ ಅಂಗಡಿ ಸಲ್ಲಿಸಿ",
    requestSuccess: "ನಿಮ್ಮ ಅಂಗಡಿ ವಿನಂತಿಯನ್ನು ಕಳುಹಿಸಲಾಗಿದೆ. ನಿರ್ವಾಹಕರ ಅನುಮೋದನೆಯ ನಂತರ ಪಟ್ಟಿ ಮಾಡಲಾಗುತ್ತದೆ.",
    requestFailed: "ವಿನಂತಿಯನ್ನು ಕಳುಹಿಸಲಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    firebaseNotConfigured: "ಅಂಗಡಿ ವಿನಂತಿ ಸಲ್ಲಿಕೆ ಇನ್ನೂ ಹೊಂದಿಸಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    directoryNotConfigured: "ಆನ್‌ಲೈನ್ ಪ್ರಕಟಣೆ ಹೊಂದಿಸಿಲ್ಲ. ವೈಶಿಷ್ಟ್ಯಗೊಳಿಸಿದ ಅಂಗಡಿಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.",
    directoryLoadFailed: "ಅನುಮೋದಿತ ಅಂಗಡಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗಲಿಲ್ಲ. ವೈಶಿಷ್ಟ್ಯಗೊಳಿಸಿದ ಅಂಗಡಿಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.",
    eyebrow: "ಸ್ಥಳೀಯ • ಸರಳ • ವಿಶ್ವಾಸಾರ್ಹ",
    marquee: ["ನಿಮ್ಮ ನೆರೆಹೊರೆಯ ಮಾರುಕಟ್ಟೆ", "ಪ್ರತಿದಿನ ತಾಜಾ ಅಗತ್ಯ ವಸ್ತುಗಳು", "ಚಿಕ್ಕ ಅಂಗಡಿಗಳು, ದೊಡ್ಡ ಆತ್ಮೀಯತೆ", "ಸ್ಥಳೀಯ ಅಂಗಡಿಗಳು, ಬಲವಾದ ಸಮುದಾಯಗಳು", "ಪ್ರತಿ ಖರೀದಿಯೂ ಸ್ಥಳೀಯ ವ್ಯಾಪಾರಕ್ಕೆ ಬೆಂಬಲ", "ಮೂಲೆಮೂಲೆಯಲ್ಲಿ ವಿಶ್ವಾಸದ ಸೇವೆ"],
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
    addDescription: "ಪರಿಶೀಲನೆಗಾಗಿ ನಿಮ್ಮ ಅಂಗಡಿ ವಿವರಗಳನ್ನು ಸಲ್ಲಿಸಿ. ಅನುಮೋದಿತ ಅಂಗಡಿಗಳನ್ನು ಇಲ್ಲಿ ಪ್ರಕಟಿಸಲಾಗುತ್ತದೆ.",
    footer: "ಸ್ಥಳೀಯ ವ್ಯಾಪಾರಗಳಿಗಾಗಿ ಮತ್ತು ಅವುಗಳನ್ನು ಪ್ರೀತಿಸುವ ಜನರಿಗಾಗಿ.",
    joinDirectory: "ಅಂಗಡಿಗಳ ಪಟ್ಟಿಗೆ ಸೇರಿ",
    modalTitle: "ನಿಮ್ಮ ಅಂಗಡಿ ಸೇರಿಸಿ",
    modalSub: "ನಿರ್ವಾಹಕರ ಪರಿಶೀಲನೆಗಾಗಿ ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಕಳುಹಿಸಿ. ಅನುಮೋದನೆಯ ನಂತರ ಅದೇ ಫೋನ್ ಸಂಖ್ಯೆಯಿಂದ ನಿಮ್ಮ ಅಂಗಡಿಯನ್ನು ನಿರ್ವಹಿಸಿ.",
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
    formNote: "ಅಂಗಡಿ ವಿನಂತಿಗಳನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಿ ಪ್ರಕಟಿಸುವ ಮೊದಲು ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ.",
    close: "ಮುಚ್ಚಿ",
    clear: "ಹುಡುಕಾಟ ತೆರವುಗೊಳಿಸಿ",
    openDaily: "● ಪ್ರತಿದಿನ ತೆರೆದಿರುತ್ತದೆ",
    whatsapp: "ವಾಟ್ಸಾಪ್",
    call: "ಕರೆ",
    visitStore: "ಅಂಗಡಿಗೆ ಭೇಟಿ",
    result: n => `${n} ಅಂಗಡಿ${n === 1 ? "" : "ಗಳು"} ಕಂಡುಬಂದಿವೆ`
  }
};

function applyLanguage(){
  const text = translations[language];
  const setText = (selector, value) => { document.querySelector(selector).textContent = value; };
  document.documentElement.lang = language === "kn" ? "kn" : "en";
  document.getElementById("languageToggle").textContent = language === "en" ? "ಕನ್ನಡ" : "English";
  document.getElementById("languageToggle").setAttribute("aria-label", language === "en" ? "Switch language to Kannada" : "ಭಾಷೆಯನ್ನು ಇಂಗ್ಲಿಷ್‌ಗೆ ಬದಲಾಯಿಸಿ");
  document.querySelector(".nav-menu summary").setAttribute("aria-label", language === "en" ? "Open menu" : "ಮೆನು ತೆರೆಯಿರಿ");
  document.querySelectorAll(".marquee-message").forEach((message, index) => {
    message.textContent = text.marquee[index % text.marquee.length];
  });
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
  document.querySelector(".footer-bottom span:last-child").textContent = text.footer;
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
  document.getElementById("submitShopRequest").textContent = text.requestPending;
  setText(".form-note", text.formNote);
  document.querySelector(".modal-close").setAttribute("aria-label", text.close);
  document.querySelector("#stockModal .modal-close").setAttribute("aria-label", text.close);
  document.getElementById("ownerLoginLink").textContent = text.ownerLogin;
  document.getElementById("adminLoginLink").textContent = text.adminLogin;
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
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
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
loadPublishedShops();

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

function isFirebaseConfigured(){
  const config = window.kiranaFirebaseConfig;
  return config && [config.apiKey, config.authDomain, config.projectId, config.appId].every(value => value && !value.startsWith("YOUR_"));
}

async function initializeFirebaseData(){
  if(firestore) return;
  if(!isFirebaseConfigured()) throw new Error("Firebase is not configured.");
  const [appSdk, appCheckSdk, firestoreModule, storageModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-check.js"),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"),
    import("https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js")
  ]);
  firebaseApp = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(window.kiranaFirebaseConfig);
  const appCheckSiteKey = window.kiranaFirebaseConfig.appCheckSiteKey;
  if(appCheckSiteKey && !appCheckSiteKey.startsWith("YOUR_")){
    appCheckSdk.initializeAppCheck(firebaseApp, {
      provider: new appCheckSdk.ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true
    });
  }
  firestoreSdk = firestoreModule;
  storageSdk = storageModule;
  firestore = firestoreSdk.getFirestore(firebaseApp);
  storage = storageSdk.getStorage(firebaseApp);
}

async function loadPublishedShops(){
  const status = document.getElementById("directoryStatus");
  if(!isFirebaseConfigured()){
    status.textContent = translations[language].directoryNotConfigured;
    return;
  }
  try{
    await initializeFirebaseData();
    const snapshot = await firestoreSdk.getDocs(firestoreSdk.collection(firestore, "shops"));
    shops = [
      ...initialShops,
      ...snapshot.docs.map(shopDocument => ({...shopDocument.data(), id: shopDocument.id}))
    ];
    status.textContent = "";
    doSearch();
  }catch(error){
    console.error("Could not load approved shops:", error);
    status.textContent = translations[language].directoryLoadFailed;
  }
}

document.getElementById("shopForm").addEventListener("submit", async event=>{
  event.preventDefault();
  const image = document.getElementById("shopImage").files[0];
  if(image && !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(image.type)){
    document.getElementById("logoStatus").textContent = translations[language].imageTypeError;
    return;
  }
  if(image && image.size > 5 * 1024 * 1024){
    document.getElementById("logoStatus").textContent = translations[language].imageTooLarge;
    return;
  }
  const data = Object.fromEntries(new FormData(event.target));
  const opening = formatFormTime(data.openHour, data.openMinute, data.openPeriod);
  const closing = formatFormTime(data.closeHour, data.closeMinute, data.closePeriod);
  const formData = new FormData(event.target);
  const openDays = formData.getAll("openDays");
  if(!openDays.length){
    document.getElementById("dayError").textContent = translations[language].selectDayError;
    return;
  }
  document.getElementById("dayError").textContent = "";
  const items = data.items.split(/[,\n]+/).map(item=>item.trim()).filter(Boolean);
  if(!items.length){
    document.getElementById("requestStatus").textContent = translations[language].requestFailed;
    return;
  }
  const submitButton = document.getElementById("submitShopRequest");
  const requestStatus = document.getElementById("requestStatus");
  submitButton.disabled = true;
  requestStatus.textContent = "";
  try{
    if(!isFirebaseConfigured()) throw new Error("Firebase is not configured.");
    await initializeFirebaseData();
    const sdk = firestoreSdk;
    const requestReference = sdk.doc(sdk.collection(firestore, "shopRequests"));
    let logo = "";
    if(image){
      const imageReference = storageSdk.ref(storage, `shop-request-images/${requestReference.id}`);
      await storageSdk.uploadBytes(imageReference, image, {contentType: image.type});
      logo = await storageSdk.getDownloadURL(imageReference);
    }
    await sdk.setDoc(requestReference, {
      name: data.shop.trim(),
      phone: data.contact.trim().replace(/\D/g, ""),
      ownerPhone: data.contact.trim(),
      address: data.address.trim(),
      openTime: opening,
      closeTime: closing,
      openDays,
      items,
      logo,
      status: "pending",
      createdAt: sdk.serverTimestamp()
    });
    requestStatus.textContent = translations[language].requestSuccess;
    event.target.reset();
    document.getElementById("logoStatus").textContent = translations[language].imageStatus;
  }catch(error){
    console.error("Could not submit shop request:", error);
    requestStatus.textContent = isFirebaseConfigured()
      ? translations[language].requestFailed
      : translations[language].firebaseNotConfigured;
  }finally{
    submitButton.disabled = false;
  }
});

document.querySelectorAll("input[name='openDays']").forEach(input=>{
  input.addEventListener("change",()=>{ document.getElementById("dayError").textContent = ""; });
});

document.getElementById("shopImage").addEventListener("change", event=>{
  const image = event.target.files[0];
  const status = document.getElementById("logoStatus");
  if(!image){ status.textContent = translations[language].imageStatus; return; }
  if(!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(image.type)){
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
