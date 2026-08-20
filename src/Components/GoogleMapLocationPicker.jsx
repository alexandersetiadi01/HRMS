import { useEffect, useRef, useState } from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";

import { loadGoogleMaps } from "../Utils/GoogleMapsLoader";

const DEFAULT_CENTER = {
  lat: 25.033,
  lng: 121.5654,
};

function isValidCoordinate(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

export default function GoogleMapLocationPicker({
  latitude,
  longitude,
  radiusMeters = 50,
  onChange,
  height = 360,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const clickListenerRef = useRef(null);
  const dragListenerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      setLoading(true);
      setErrorText("");

      try {
        const google = await loadGoogleMaps();
        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } =
          await google.maps.importLibrary("marker");

        if (cancelled || !containerRef.current) return;

        const hasPosition = isValidCoordinate(
          latitude,
          longitude,
        );

        const position = hasPosition
          ? {
              lat: Number(latitude),
              lng: Number(longitude),
            }
          : DEFAULT_CENTER;

        const mapId = String(
          import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ||
            "DEMO_MAP_ID",
        ).trim();

        const map = new Map(containerRef.current, {
          center: position,
          zoom: hasPosition ? 17 : 12,
          mapId,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });

        const marker = new AdvancedMarkerElement({
          map,
          position,
          gmpDraggable: true,
          title: "打卡地點",
        });

        const circle = new google.maps.Circle({
          map,
          center: position,
          radius: Math.max(
            1,
            Number(radiusMeters) || 1,
          ),
          clickable: false,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillOpacity: 0.15,
        });

        mapRef.current = map;
        markerRef.current = marker;
        circleRef.current = circle;

        clickListenerRef.current = map.addListener(
          "click",
          (event) => {
            const lat = event.latLng?.lat();
            const lng = event.latLng?.lng();

            if (
              !Number.isFinite(lat) ||
              !Number.isFinite(lng)
            ) {
              return;
            }

            const nextPosition = { lat, lng };

            marker.position = nextPosition;
            circle.setCenter(nextPosition);

            onChange?.({
              latitude: lat,
              longitude: lng,
            });
          },
        );

        dragListenerRef.current = marker.addListener(
          "dragend",
          () => {
            const markerPosition = marker.position;

            const lat =
              typeof markerPosition?.lat === "function"
                ? markerPosition.lat()
                : Number(markerPosition?.lat);

            const lng =
              typeof markerPosition?.lng === "function"
                ? markerPosition.lng()
                : Number(markerPosition?.lng);

            if (
              !Number.isFinite(lat) ||
              !Number.isFinite(lng)
            ) {
              return;
            }

            circle.setCenter({ lat, lng });

            onChange?.({
              latitude: lat,
              longitude: lng,
            });
          },
        );
      } catch (error) {
        console.error(
          "Failed to initialize Google Maps:",
          error,
        );

        if (!cancelled) {
          setErrorText(
            error?.message ||
              "Google Maps 載入失敗。",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initializeMap();

    return () => {
      cancelled = true;

      clickListenerRef.current?.remove?.();
      dragListenerRef.current?.remove?.();

      if (markerRef.current) {
        markerRef.current.map = null;
      }

      circleRef.current?.setMap?.(null);

      clickListenerRef.current = null;
      dragListenerRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (
      !mapRef.current ||
      !markerRef.current ||
      !circleRef.current ||
      !isValidCoordinate(latitude, longitude)
    ) {
      return;
    }

    const position = {
      lat: Number(latitude),
      lng: Number(longitude),
    };

    markerRef.current.position = position;
    circleRef.current.setCenter(position);
    mapRef.current.panTo(position);
  }, [latitude, longitude]);

  useEffect(() => {
    if (!circleRef.current) return;

    circleRef.current.setRadius(
      Math.max(1, Number(radiusMeters) || 1),
    );
  }, [radiusMeters]);

  return (
    <Box>
      <Typography
        sx={{
          mb: "8px",
          fontSize: "13px",
          color: "#6b7280",
        }}
      >
        點選地圖或拖曳標記選擇打卡地點，圓形範圍代表允許範圍。
      </Typography>

      {errorText ? (
        <Alert severity="error">
          {errorText}
        </Alert>
      ) : null}

      <Box
        sx={{
          position: "relative",
          height,
          overflow: "hidden",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          bgcolor: "#f3f4f6",
        }}
      >
        <Box
          ref={containerRef}
          sx={{
            width: "100%",
            height: "100%",
          }}
        />

        {loading ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(255,255,255,0.78)",
            }}
          >
            <CircularProgress size={30} />
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}