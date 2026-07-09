import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoundWeave — AI Spatial Audio Story Builder",
  description:
    "Transform text scripts into immersive 3D spatial audio stories with IBM Granite AI. For podcasters, audio drama creators, and game designers.",
  keywords: ["spatial audio", "AI", "podcast", "audio drama", "IBM Granite"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
