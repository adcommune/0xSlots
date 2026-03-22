import { sdk } from "@farcaster/miniapp-sdk";

/**
 * Checks if the SDK is ready and initialized
 */
export function isSdkReady(): boolean {
  try {
    // Check if SDK exists
    if (!sdk) {
      console.error("[@adland/react] SDK is not available");
      return false;
    }

    // Check if quickAuth is available
    if (!sdk.quickAuth) {
      console.error(
        "[@adland/react] SDK quickAuth is not available. Make sure the SDK is properly initialized.",
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("[@adland/react] Error checking SDK readiness:", error);
    return false;
  }
}

/**
 * Sends a tracking request using the SDK's quickAuth
 */
export async function sendTrackRequest(
  url: string,
  data: {
    type: "view" | "click";
    slot: string;
  },
): Promise<Response> {
  if (!isSdkReady()) {
    console.error(
      "[@adland/react] SDK is not ready. Cannot send tracking request.",
    );
    return Promise.reject(
      new Error(
        "[@adland/react] SDK is not ready. Cannot send tracking request.",
      ),
    );
  }

  try {
    if (!sdk.quickAuth) {
      throw new Error("[@adland/react] SDK quickAuth is not available");
    }

    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-type": "farcaster",
      },
      body: JSON.stringify(data),
    };

    // Log request details for debugging
    console.log("[@adland/react] Sending track request:", {
      url,
      method: requestOptions.method,
      headers: requestOptions.headers,
      body: data,
    });

    const response = await sdk.quickAuth.fetch(url, requestOptions);

    // Check if response is ok
    if (!response.ok) {
      const statusText = response.statusText;
      const status = response.status;

      // Try to get error body if available
      let errorBody = null;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          errorBody = await response.clone().json();
        } else {
          errorBody = await response.clone().text();
        }
      } catch (e) {
        // Ignore errors when reading response body
      }

      console.error("[@adland/react] Track request failed:", {
        url,
        status,
        statusText,
        errorBody,
        requestBody: data,
      });

      throw new Error(
        `[@adland/react] Track request failed: ${status} ${statusText}${errorBody ? ` - ${JSON.stringify(errorBody)}` : ""}`,
      );
    }

    return response;
  } catch (error) {
    // Enhanced error logging
    if (error instanceof Error) {
      console.error("[@adland/react] Error sending track request:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        url,
        requestData: data,
      });
    } else {
      console.error("[@adland/react] Unknown error sending track request:", {
        error,
        url,
        requestData: data,
      });
    }
    throw error;
  }
}

/**
 * Checks if SDK actions are ready
 */
export async function checkSdkActionsReady(): Promise<boolean> {
  try {
    if (!sdk) {
      console.error("[@adland/react] SDK is not available");
      return false;
    }

    if (!sdk.actions) {
      console.error("[@adland/react] SDK actions are not available");
      return false;
    }

    // Check if ready() function exists
    if (typeof sdk.actions.ready !== "function") {
      console.error(
        "[@adland/react] SDK actions.ready() is not available. Make sure the SDK is properly initialized.",
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "[@adland/react] Error checking SDK actions readiness:",
      error,
    );
    return false;
  }
}
