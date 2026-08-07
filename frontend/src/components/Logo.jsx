import React from "react";
import { Link } from "react-router-dom";

export const Logo = ({ className = "", height = 26, iconOnly = false }) => (
  <Link to="/" className={`flex items-center ${className}`} data-testid="logo-link" aria-label="SENTIENT-AI">
    <img
      src={iconOnly ? "/logo-icon.png" : "/logo-full.png"}
      alt="SENTIENT-AI"
      style={{ height }}
      className="w-auto select-none"
      draggable={false}
    />
  </Link>
);
