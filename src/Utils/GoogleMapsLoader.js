let googleMapsPromise = null;

export function loadGoogleMaps() {
  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = String(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  ).trim();

  if (!apiKey) {
    return Promise.reject(
      new Error("尚未設定 Google Maps API Key。"),
    );
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[data-hrms-google-maps="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.google?.maps?.importLibrary) {
          resolve(window.google);
        } else {
          reject(new Error("Google Maps 載入失敗。"));
        }
      });

      existingScript.addEventListener("error", () => {
        reject(new Error("Google Maps 載入失敗。"));
      });

      return;
    }

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      "&loading=async&v=weekly";
    script.async = true;
    script.defer = true;
    script.dataset.hrmsGoogleMaps = "true";

    script.onload = () => {
      if (window.google?.maps?.importLibrary) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps 載入失敗。"));
      }
    };

    script.onerror = () => {
      reject(new Error("Google Maps 載入失敗。"));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}