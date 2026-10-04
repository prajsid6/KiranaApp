# Kirana Store

A responsive kirana directory with Firebase-backed shop onboarding, admin review, and owner management.

## Files
- `index.html` — public directory, language menu, and shop request form
- `admin.html` / `admin.js` — admin sign-in and shop onboarding review dashboard
- `owner.html` / `owner.js` — shop owner sign-in and approved shop management
- `script.js` / `style.css` — directory behavior and styling
- `firebase-config.js` — Firebase web app settings
- `firestore.rules` / `storage.rules` — database and shop-image access rules

## Firebase setup
1. Create a Firebase project and register a web app.
2. Enable **Authentication > Sign-in method > Phone** and add the production domain under authorized domains.
3. Create a Firestore database and enable Firebase Storage.
4. Copy the web app's `apiKey`, `authDomain`, `projectId`, `storageBucket`, and `appId` into `firebase-config.js`. Use the exact storage bucket value from Firebase; some existing projects use a `.appspot.com` bucket.
5. In `firestore.rules`, replace `+91REPLACE_WITH_ADMIN_PHONE` with each authorized admin phone number in E.164 format (for example, `+919876543210`). Deploy both rule files in the Firebase console.
6. Use Firebase Phone Authentication for each admin and shop owner. Only allowlisted admin numbers can read/review onboarding requests and publish shops. Shop owners sign in with the E.164 phone number submitted with their shop request; after an admin approves it, that number can update the assigned shop's details and items. Owner phone-to-shop assignments are kept in the private `shopOwners` collection. Firestore rules prevent owners from approving requests or changing shop ownership. Do not rely on client-side role checks.
7. Serve the site over HTTPS or localhost, not `file://`. Firebase Phone Authentication uses reCAPTCHA and the project's SMS configuration.
8. Register a reCAPTCHA v3 provider for Firebase App Check and put its site key in `appCheckSiteKey` in `firebase-config.js`. Configure the hosting domain in App Check, then enforce App Check for Firestore and Storage to reduce automated public submissions.

Shop requests are saved in the `shopRequests` collection with `pending` status. Admins can approve and publish a request or reject it. Approval creates the published listing and associates it with the submitted owner phone number. The owner dashboard lets that verified phone number update shop details. Static featured shops in `script.js` remain visible alongside approved Firebase listings.

For shops already published in Firestore before owner login is enabled, an admin must create the matching `shopOwners/{shopId}` assignment with the owner's E.164 `phone` and a `createdAt` timestamp before that owner can sign in.

Shop images are optional and limited to 5 MB. The Storage rules allow image upload and read access for these opaque request-image paths; do not upload confidential images. Firebase web configuration is public by design, so the Firestore and Storage rules—not the client code—must enforce access.

The public listing still uses each shop's phone number for WhatsApp and phone contact. The site stores shop request details in Firebase until an admin handles them; configure any required retention/deletion policy for rejected requests.
