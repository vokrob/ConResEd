import { QrCode } from "../components/QrCode.jsx";

export function ShareQrFooter({ publicUrl }) {
  if (!publicUrl) return null;

  return (
    <section className="share-qr-footer">
      <div className="share-qr-card">
        <div className="share-qr-copy">
          <a className="share-qr-link" href={publicUrl} target="_blank" rel="noreferrer">
            {publicUrl}
          </a>
        </div>
        <div className="share-qr-image">
          <QrCode text={publicUrl} size={160} />
        </div>
      </div>
    </section>
  );
}

