import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { JoinForm } from "./_join-form";

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[oklch(0.06_0.01_260)]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <JoinForm />
    </Suspense>
  );
}
