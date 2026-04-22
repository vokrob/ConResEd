import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ text, size = 200, className = "" }) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!text) {
        if (!cancelled) setDataUrl("");
        return;
      }
      try {
        const url = await QRCode.toDataURL(text, {
          width: size,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#111827", light: "#ffffff" },
        });
        if (!cancelled) setDataUrl(url);
      } catch {
        if (!cancelled) setDataUrl("");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [text, size]);

  if (!dataUrl) return null;

  return (
    <img
      className={className}
      src={dataUrl}
      width={size}
      height={size}
      alt="QR-код"
      loading="lazy"
    />
  );
}

