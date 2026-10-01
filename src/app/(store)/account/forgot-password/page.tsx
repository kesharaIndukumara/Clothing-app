import { AuthCard } from "../auth-card";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPage() {
  return (
    <AuthCard title="Forgot your password?" subtitle="Enter your email and we'll send you a link to reset it.">
      <ForgotForm />
    </AuthCard>
  );
}
