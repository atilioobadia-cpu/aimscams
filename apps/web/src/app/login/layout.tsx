import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - AIMSCAMS",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>;
}
