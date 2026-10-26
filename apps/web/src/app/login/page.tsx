import { WakandiLoginShell } from "@/components/auth/wakandi-login-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <WakandiLoginShell>
      <LoginForm />
    </WakandiLoginShell>
  );
}
