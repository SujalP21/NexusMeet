import React from "react";

export function BrandMark({ as: Component = "div", className = "", ...props }) {
    return (
        <Component className={`nm-brand ${className}`.trim()} {...props}>
            <span className="nm-brand-mark" aria-hidden="true">N</span>
            <span>NexusMeet</span>
        </Component>
    );
}

export function ButtonLink({ className = "", variant = "primary", ...props }) {
    return (
        <button
            className={`nm-button nm-button-${variant} ${className}`.trim()}
            type="button"
            {...props}
        />
    );
}

export function Field({ id, label, caption, className = "", ...props }) {
    return (
        <label className={`nm-field ${className}`.trim()} htmlFor={id}>
            <span className="nm-label">{label}</span>
            <input className="nm-input" id={id} {...props} />
            {caption ? <span className="nm-caption">{caption}</span> : null}
        </label>
    );
}

export function StatusBadge({ children, tone = "neutral" }) {
    return (
        <span className={`nm-badge nm-badge-${tone}`}>
            {tone === "live" ? <span className="nm-status-dot" aria-hidden="true" /> : null}
            {children}
        </span>
    );
}
