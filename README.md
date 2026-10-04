# Kirana Store

A responsive kirana directory with Firebase-backed shop submissions and a phone-verified review dashboard.

## Files
- `index.html` — public directory, language menu, and shop request form
- `owner.html` / `owner.js` — reviewer sign-in and pending request dashboard
- `script.js` / `style.css` — directory behavior and styling
- `firebase-config.js` — Firebase web app settings
- `firestore.rules` / `storage.rules` — database and shop-image access rules

## Firebase setup
1. Create a Firebase project and register a web app.
2. Enable **Authentication > Sign-in method > Phone** and add the production domain under authorized domains.
3. Create a Firestore database and enable Firebase Storage.
4. Copy the web app's `apiKey`, `authDomain`, `projectId`, `storageBucket`, and `appId` into `firebase-config.js`. Use the exact storage bucket value from Firebase; some existing projects use a `.appspot.com` bucket.
5. In both `firestore.rules` and `storage.rules`, replace `+91REPLACE_WITH_REVIEWER_PHONE` with each authorized reviewer phone number in E.164 format (for example, `+919876543210`). Deploy both rule files in the Firebase console.
6. Use the same phone number for Firebase Phone Authentication. Only phone numbers in the rules allowlist can read or review pending requests and publish shops. Do not add reviewer credentials or allowlist checks only in client-side JavaScript.
7. Serve the site over HTTPS or localhost, not `file://`. Firebase Phone Authentication uses reCAPTCHA and the project's SMS configuration.
8. Register a reCAPTCHA v3 provider for Firebase App Check and put its site key in `appCheckSiteKey` in `firebase-config.js`. Configure the hosting domain in App Check, then enforce App Check for Firestore and Storage to reduce automated public submissions.

Shop requests are saved in the `shopRequests` collection with `pending` status. Reviewers can verify and publish a request or reject it. Only documents in `shops` are readable by the public directory; approval creates the published listing. Static featured shops in `script.js` remain visible alongside approved Firebase listings.

Shop images are optional and limited to 5 MB. The Storage rules allow image upload and read access for these opaque request-image paths; do not upload confidential images. Firebase web configuration is public by design, so the Firestore and Storage rules—not the client code—must enforce access.

The public listing still uses each shop's phone number for WhatsApp and phone contact. The site stores shop request details in Firebase until a reviewer handles them; configure any required retention/deletion policy for rejected requests.
