import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import InvoiceForm from "@/components/InvoiceForm";
import { api } from "@/lib/api";
import type { Invoice } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/invoices/$id/edit")({
  component: EditInvoicePage,
});

function EditInvoicePage() {
  const { id } = Route.useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    api<{ invoice: Invoice }>(`/api/invoices/${id}`)
      .then((r) => setInvoice(r.invoice))
      .catch((e) => toast.error(e.message));
  }, [id]);

  if (!invoice) return <p className="text-muted-foreground">Loading…</p>;
  return <InvoiceForm initial={invoice} />;
}
