"use server";

function hasBigInt(obj: any): boolean {
  if (typeof obj === "bigint") return true;
  if (Array.isArray(obj)) return obj.some(hasBigInt);
  if (obj && typeof obj === "object") {
    return Object.values(obj).some(hasBigInt);
  }
  return false;
}

export const logOnServer = async (data: string | object | object[]) => {
  if (typeof data === "string") {
    console.log(data);
  } else if (Array.isArray(data)) {
    data.forEach((item) => {
      if (hasBigInt(item)) {
        console.log(
          JSON.stringify(
            item,
            (v: any) => (typeof v === "bigint" ? v.toString() : v),
            2,
          ),
        );
      } else {
        console.log(item);
      }
    });
  } else if (typeof data === "object" && data !== null) {
    if (hasBigInt(data)) {
      console.log(
        JSON.stringify(
          data,
          (v: any) => (typeof v === "bigint" ? v.toString() : v),
          2,
        ),
      );
    } else {
      console.log(data);
    }
  }
};
