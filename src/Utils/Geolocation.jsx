import { hasGrantedLocationConsent } from "./LocationConsent";

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!hasGrantedLocationConsent()) {
      reject(new Error("尚未同意網站使用定位資訊。"));
      return;
    }

    if (!navigator.geolocation) {
      reject(new Error("此瀏覽器不支援地理定位功能。"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        if (error.code === 1) {
          reject(new Error("瀏覽器或裝置已拒絕定位權限。"));
          return;
        }

        if (error.code === 2) {
          reject(
            new Error("目前無法取得定位資訊，請確認手機定位已開啟並稍後再試。"),
          );
          return;
        }

        if (error.code === 3) {
          reject(new Error("定位逾時，請移至訊號較佳處後再試。"));
          return;
        }

        reject(new Error(error.message || "無法取得位置資訊。"));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );
  });
}