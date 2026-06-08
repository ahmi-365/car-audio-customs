import { auth } from "@/lib/api";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (auth.getToken()) throw redirect({ to: "/invoices" });
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
