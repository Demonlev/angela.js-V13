import admin from "firebase-admin";

const SERVICE_ACCOUNT = process.env.SERVICE_ACCOUNT;

if (SERVICE_ACCOUNT === undefined) throw new Error("Firebase key wrong");

const serviceAccount = JSON.parse(Buffer.from(SERVICE_ACCOUNT, "base64").toString("ascii"));

export const firebase = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
