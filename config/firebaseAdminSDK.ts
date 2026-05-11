import admin from "firebase-admin";

const firebasePrivateKey = process.env.FIREBASE_PRIVATE_KEY;
if (!firebasePrivateKey) {
    throw new Error("FIREBASE_PRIVATE_KEY is required");
}

admin.initializeApp({
    credential:
        admin.credential.cert({
            projectId:
                process.env
                    .FIREBASE_PROJECT_ID,

            clientEmail:
                process.env
                    .FIREBASE_CLIENT_EMAIL,

            privateKey:
                firebasePrivateKey
                    .replace(/\\n/g, "\n"),
        }),
});

export default admin;