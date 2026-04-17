import { redirect } from "next/navigation";
import { readHost } from "@/lib/live-session";
import { HostSessionView } from "./_view";

export default async function HostSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  if (!(await readHost())) {
    redirect("/host/login");
  }
  const { sessionId } = await params;
  return <HostSessionView sessionId={sessionId} />;
}
