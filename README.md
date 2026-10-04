# Kirana Store — Static Kirana Directory

A backend-free responsive website for listing local Kirana shops.

## Files
- `index.html` — page structure
- `style.css` — modern responsive design
- `script.js` — static shop data, search, and WhatsApp request flow
- `firebase-config.js` — Firebase web app configuration for owner phone login

## Setup
1. Open `script.js`.
2. Replace `REQUEST_WHATSAPP` with the WhatsApp number that should receive shop-add requests.
3. Edit the `shops` array to add/update shop listings.
4. For Firebase phone login, create a Firebase project and register a web app.
5. Enable **Authentication > Sign-in method > Phone** and configure authorized domains in Firebase Authentication settings.
6. Copy the Firebase web app `apiKey`, `authDomain`, `projectId`, and `appId` into `firebase-config.js`.
7. Set each shop's `ownerPhone` in `script.js` to the owner's verified phone number using country code digits (for example, `919876543210`). The customer types it in international format (for example, `+919876543210`).
8. Serve the site over HTTPS or localhost; Firebase phone authentication does not work reliably from a `file://` URL. Firebase uses reCAPTCHA and its configured SMS quota/provider to send OTP codes.
9. Open the site from the authorized domain.

The directory and profile mappings remain static in `script.js`; OTP verification is real Firebase Phone Auth, but managing shop profiles dynamically requires a backend/database. Do not treat client-side profile fields as private or use this static mapping to authorize sensitive owner actions.

## WhatsApp
Shop cards use each shop's phone number for direct WhatsApp contact.
The "Request to Add My Shop" form creates a WhatsApp message containing:
Shop name, logo URL, contact details, available items, and shop timing.
