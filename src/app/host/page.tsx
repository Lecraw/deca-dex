import { redirect } from "next/navigation";
import { readHost } from "@/lib/live-session";
import { HostDashboard } from "./_dashboard";

export default async function HostPage() {
  if (!(await readHost())) {
    redirect("/host/login");
  }
  return <HostDashboard />;
}
