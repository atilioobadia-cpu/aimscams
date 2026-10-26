import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - AIMSCAMS",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`body { background-color: #ffffff !important; }`}</style>
      {children}
    </>
  );
}
