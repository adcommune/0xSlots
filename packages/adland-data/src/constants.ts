export const adlandApiUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3069"
    : "https://api.0xslots.org";

export const debug = true;
