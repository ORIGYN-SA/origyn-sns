export const DERIVATION_ORIGIN = "https://jbj2y-2qaaa-aaaal-ajc5q-cai.icp0.io";

export const IDENTITYKIT_SIGNER_STORAGE_KEY = "signerId";
export const IDENTITYKIT_CONNECTED_STORAGE_KEY = "connected";
export const OISY_SIGNER_ID = "OISY";

export const clearLegacyIdentityKitOisySession = () => {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(IDENTITYKIT_SIGNER_STORAGE_KEY) !== OISY_SIGNER_ID) {
    return;
  }
  localStorage.removeItem(IDENTITYKIT_SIGNER_STORAGE_KEY);
  localStorage.removeItem(IDENTITYKIT_CONNECTED_STORAGE_KEY);
};
