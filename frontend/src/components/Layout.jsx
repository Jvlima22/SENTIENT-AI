import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AIChatWidget } from "@/components/AIChatWidget";

export const Layout = ({ children }) => (
  <div className="min-h-screen flex flex-col relative">
    <Navbar />
    <main className="flex-1 relative z-10">{children}</main>
    <Footer />
    <AIChatWidget />
  </div>
);
