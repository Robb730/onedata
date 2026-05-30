import { FolderOpen, Plus, User } from "lucide-react";

/**
 * SectionFolderCard — Section-level folder card matching FolderCard aesthetics.
 *
 * @param {string}   name
 * @param {string}   owner
 * @param {function} [onClick]
 * @param {"folder"|"create"} [variant="folder"]
 */
export function SectionFolderCard({
  name,
  owner,
  onClick,
  variant = "folder",
}) {
  if (variant === "create") {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          minHeight: 180,
          width: "100%",
          borderRadius: 12,
          border: "1.5px dashed var(--color-border-secondary, #ccc)",
          background: "transparent",
          padding: "2rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: "pointer",
          transition: "border-color 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#1D9E75";
          e.currentTarget.style.background = "#E1F5EE55";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border-secondary, #ccc)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "var(--color-background-secondary, #f5f5f3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={20} style={{ color: "var(--color-text-tertiary, #aaa)" }} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary, #666)", margin: 0 }}>
          Create section
        </p>
        <p style={{ fontSize: 12, color: "var(--color-text-tertiary, #aaa)", margin: 0 }}>
          Add to this division
        </p>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      role="button"
      tabIndex={0}
      style={{
        minHeight: 180,
        width: "100%",
        borderRadius: 12,
        border: "0.5px solid var(--color-border-tertiary, #e2e2e2)",
        background: "var(--color-background-primary, #fff)",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        cursor: "pointer",
        transition: "border-color 0.15s, transform 0.15s",
        outline: "none",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "var(--color-border-primary, #bbb)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = "var(--color-border-tertiary, #e2e2e2)";
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 2px #1D9E75";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Top: icon + active badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: "#E1F5EE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s",
          }}
        >
          <FolderOpen size={22} style={{ color: "#085041" }} />
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 500,
            padding: "3px 9px",
            borderRadius: 999,
            background: "#EAF3DE",
            color: "#3B6D11",
            border: "0.5px solid #C0DD97",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
          Active
        </span>
      </div>

      {/* Name — full wrap, no truncation */}
      <p
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--color-text-primary, #111)",
          lineHeight: 1.4,
          wordBreak: "break-word",
          margin: 0,
          flex: 1,
        }}
      >
        {name}
      </p>

      {/* Owner row */}
      <div
        style={{
          background: "var(--color-background-secondary, #f5f5f3)",
          borderRadius: 8,
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
        }}
      >
        <User size={13} style={{ color: "var(--color-text-tertiary, #aaa)", flexShrink: 0 }} />
        <span style={{ color: "var(--color-text-secondary, #666)", flexShrink: 0 }}>Managed by</span>
        <span style={{ marginLeft: "auto", fontWeight: 500, color: "var(--color-text-primary, #111)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "50%" }}>
          {owner}
        </span>
      </div>
    </div>
  );
}