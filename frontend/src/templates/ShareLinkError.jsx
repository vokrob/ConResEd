export default function ShareLinkError() {
  return (
    <div
      style={{
        minHeight: "50vh",
        padding: 40,
        textAlign: "center",
        fontFamily: 'system-ui, "Segoe UI", sans-serif',
        background: "#f1f5f9",
        color: "#334155",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p style={{ maxWidth: 420, margin: 0, lineHeight: 1.5 }}>
        Не удалось открыть резюме по ссылке. Возможно, оно удалено или ссылка устарела.
      </p>
    </div>
  );
}
