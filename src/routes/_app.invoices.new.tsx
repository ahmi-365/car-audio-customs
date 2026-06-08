import { createFileRoute } from "@tanstack/react-router";
import InvoiceForm from "@/components/InvoiceForm";

export const Route = createFileRoute("/_app/invoices/new")({
  component: () => <InvoiceForm />,
});
