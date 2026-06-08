import logo from "@/assets/hr-logo.png";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, fetchPdfBlob } from "@/lib/api";
import type { Invoice } from "@/lib/types";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download, Mail, Pencil, Printer, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/invoices/$id/")({
  component: InvoiceViewPage,
});

const COMPANY = {
  name: "HR Car Audio & Tints",
  email: "info@hrcaraudio.co.uk",
  phone: "+44 7865 543241",
  site: "hrcaraudio.co.uk",
};

function fmt(n: number) {
  return `£${Number(n || 0).toFixed(2)}`;
}

function InvoiceViewPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api<{ invoice: Invoice }>(`/api/invoices/${id}`)
      .then((r) => {
        setInvoice(r.invoice);
        setEmailTo(r.invoice.client?.email || "");
        setEmailSubject(`Invoice ${r.invoice.invoiceNumber} – HR Car Audio & Tints`);
        setEmailMessage(
          `Your invoice for professional installation and customization services has been generated. Please find the details below and a full itemized PDF attached.`
        );
      })
      .catch((e) => toast.error(e.message));
  }, [id]);

  if (!invoice) return <p className="text-muted-foreground">Loading…</p>;

  async function handleDownload() {
    try {
      const blob = await fetchPdfBlob(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice!.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleSendEmail() {
    if (!emailTo) return toast.error("Recipient email required");
    setSending(true);
    try {
      await api(`/api/invoices/${id}/email`, {
        method: "POST",
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          message: emailMessage || undefined,
        }),
      });
      toast.success("Invoice emailed");
      setEmailOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    try {
      await api(`/api/invoices/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      navigate({ to: "/invoices" });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link to="/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-1" /> Email
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Email Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Enter your message here..."
                    className="min-h-[150px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEmailOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendEmail} disabled={sending}>
                  {sending ? "Sending…" : "Send"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Link to="/invoices/$id/edit" params={{ id }}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="print:shadow-none print:border-0">
        <CardContent className="p-8 print:p-0">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
            <img src={logo} alt="HR" className="h-20 w-auto" />
            <div className="sm:text-right text-sm">
              <div className="font-bold text-lg">{COMPANY.name}</div>
              <div>{COMPANY.email}</div>
              <div>{COMPANY.phone}</div>
              <div>{COMPANY.site}</div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-3xl font-bold text-black">INVOICE</h2>
            <hr className="my-3" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div className="space-y-1">
              <Field label="Invoice Number" value={invoice.invoiceNumber} />
              <Field
                label="Invoice Date"
                value={new Date(invoice.createdAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            </div>
            <div>
              <div className="font-bold mb-1">Bill To:</div>
              <div className="font-medium text-base">{invoice.client.name}</div>
              {invoice.client.regNo && <div>Reg No: {invoice.client.regNo}</div>}
              {invoice.client.address && <div className="text-muted-foreground">{invoice.client.address}</div>}
              {invoice.client.phone && <div>Phone: {invoice.client.phone}</div>}
              {invoice.client.email && <div>{invoice.client.email}</div>}
            </div>
          </div>

          <hr className="my-4" />

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Unit Price</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">
                      <div className="font-medium">{it.name}</div>
                      {it.description && (
                        <div className="text-xs text-muted-foreground italic">
                          {it.description}
                        </div>
                      )}
                    </td>
                    <td className="text-center">{fmt(it.price)}</td>
                    <td className="text-center">{it.quantity}</td>
                    <td className="text-right">{fmt(it.price * it.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-4">
            <div className="w-full sm:w-72 space-y-1 text-sm">
              {invoice.subtotal !== invoice.total && (
                <Row label="Subtotal" value={fmt(invoice.subtotal)} />
              )}
              <Row label="Total" value={fmt(invoice.total)} bold />
              <Row label="Amount Paid" value={fmt(invoice.depositPaid)} />
              <hr />
              {invoice.balanceDue > 0 && (
                <Row label="Balance Due" value={fmt(invoice.balanceDue)} bold className="text-black" />
              )}
              {invoice.paymentMethod && invoice.paymentMethod !== "None" && (
                <div className="flex justify-between text-muted-foreground pt-1">
                  <span>Method</span>
                  <span>{invoice.paymentMethod}</span>
                </div>
              )}
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-6">
              <div className="font-bold text-sm">Notes:</div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </div>
          )}

          <div className="mt-12 text-center text-xs text-muted-foreground border-t pt-4">
            <div className="text-black text-left text-[7px] mb-4">
              <p className="font-bold">Terms & Conditions:</p>
              <p>All labour charges are non-refundable once the work has been completed and approved.</p>
              <p>All parts supplied are non-refundable, except where required under your statutory rights.</p>
              <p>We offer up to 12 months warranty on selected parts and installations, subject to manufacturer terms and normal usage.</p>
              <p>In the event of a faulty item, it will be repaired or replaced on a like-for-like basis under manufacturer warranty.</p>
              <p>Faults must be reported within 28 days of installation.</p>
              <p>No refunds will be issued for faulty goods unless a repair or replacement is not possible, in line with your consumer rights.</p>
              <p>We are not responsible for pre-existing faults in the vehicle, including factory systems, wiring, amplifiers, or previously installed equipment.</p>
              <p>Any customer-supplied parts are fitted at the customer’s own risk and are not covered under our warranty.</p>
              <p>Warranty does not cover accidental damage, misuse, or wear and tear.</p>
              <p>By proceeding with the installation, you agree to the above terms and conditions.</p>
            </div>
            Thank you for your business. Monday to Saturday 9am to 6pm
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="font-bold w-32">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  accent,
  className = "",
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex justify-between ${bold ? "font-semibold" : ""} ${
        accent ? "text-primary text-base font-bold" : ""
      } ${className}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
