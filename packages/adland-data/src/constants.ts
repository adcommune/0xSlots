export const adlandApiUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3069"
    : "https://api.adland.space";

export const debug = true;
