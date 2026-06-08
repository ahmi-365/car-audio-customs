import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { Invoice, InvoiceItem, InvoicePayload } from "@/lib/types";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  initial?: Invoice;
};

function emptyItem(): InvoiceItem {
  return { name: "", description: "", price: 0, quantity: 1 };
}

export default function InvoiceForm({ initial }: Props) {
  const navigate = useNavigate();
  const isEdit = !!initial;

  const [client, setClient] = useState({
    name: initial?.client.name || "",
    regNo: initial?.client.regNo || "",
    address: initial?.client.address || "",
    phone: initial?.client.phone || "",
    email: initial?.client.email || "",
  });
  const [items, setItems] = useState<InvoiceItem[]>(
    initial?.items?.length ? initial.items.map((i) => ({ ...i })) : [emptyItem()]
  );
  const [depositPaid, setDepositPaid] = useState<number>(initial?.depositPaid || 0);
  const [paymentMethod, setPaymentMethod] = useState<InvoicePayload["paymentMethod"]>(
    initial?.paymentMethod || "None"
  );
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0
  );
  const total = subtotal;
  const balanceDue = +(total - (Number(depositPaid) || 0)).toFixed(2);

  function updateItem(idx: number, patch: Partial<InvoiceItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!client.name.trim()) return toast.error("Client name is required");
    const cleanItems = items.filter((i) => i.name.trim());
    if (cleanItems.length === 0) return toast.error("Add at least one product");

    const payload: InvoicePayload = {
      client,
      items: cleanItems,
      notes,
      depositPaid: Number(depositPaid) || 0,
      paymentMethod,
    };

    setSaving(true);
    try {
      if (isEdit) {
        const res = await api<{ invoice: Invoice }>(`/api/invoices/${initial!._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Invoice updated");
        navigate({ to: "/invoices/$id", params: { id: res.invoice._id } });
      } else {
        const res = await api<{ invoice: Invoice }>("/api/invoices", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success(`Invoice ${res.invoice.invoiceNumber} created`);
        navigate({ to: "/invoices/$id", params: { id: res.invoice._id } });
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isEdit ? "Edit Invoice" : "New Invoice"}</h1>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleString("en-GB")}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Client Name *</Label>
            <Input
              value={client.name}
              onChange={(e) => setClient({ ...client, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Vehicle Reg No</Label>
            <Input
              value={client.regNo}
              onChange={(e) => setClient({ ...client, regNo: e.target.value })}
              placeholder="e.g. AB12 CDE"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Address (optional)</Label>
            <Input
              value={client.address}
              onChange={(e) => setClient({ ...client, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={client.phone}
              onChange={(e) => setClient({ ...client, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={client.email}
              onChange={(e) => setClient({ ...client, email: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Products</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setItems((p) => [...p, emptyItem()])}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="flex flex-col md:grid md:grid-cols-12 gap-4 items-start p-4 border rounded-lg bg-muted/20 relative"
            >
              <div className="w-full md:col-span-6 lg:col-span-5 space-y-2">
                <Label className="text-xs">Product Name *</Label>
                <Input
                  value={it.name}
                  onChange={(e) => updateItem(idx, { name: e.target.value })}
                  placeholder="e.g. Pioneer SPH-DA77DAB"
                />
                <Textarea
                  value={it.description || ""}
                  onChange={(e) => updateItem(idx, { description: e.target.value })}
                  placeholder="Description (optional)"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 md:contents gap-4 w-full">
                <div className="space-y-2 md:col-span-2 lg:col-span-2">
                  <Label className="text-xs">Price (£)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.price}
                    onChange={(e) =>
                      updateItem(idx, { price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-1 lg:col-span-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min={1}
                    value={it.quantity}
                    onChange={(e) =>
                      updateItem(idx, { quantity: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>
              <div className="w-full md:col-span-3 lg:col-span-4 flex items-center md:items-end justify-between md:flex-col gap-2 pt-2 md:pt-0">
                <div className="flex flex-col items-start md:items-end">
                  <Label className="text-xs">Line Total</Label>
                  <div className="font-bold text-lg text-primary">
                    £{((Number(it.price) || 0) * (Number(it.quantity) || 1)).toFixed(2)}
                  </div>
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount Paid (£)</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={depositPaid}
                onChange={(e) => setDepositPaid(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Enter partial deposit or full payment amount.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <option value="None">None / Pending</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mixed">Mixed / Other</option>
              </select>
            </div>

            <div className="flex gap-2 flex-wrap mt-2">
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  setDepositPaid(total);
                  setPaymentMethod("Cash");
                }}
              >
                Paid in Full (Cash)
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={() => {
                  setDepositPaid(total);
                  setPaymentMethod("Card");
                }}
              >
                Paid in Full (Card)
              </Button>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 self-start">
            {subtotal !== total && (
              <Row label="Subtotal" value={`£${subtotal.toFixed(2)}`} />
            )}
            <Row label="Total" value={`£${total.toFixed(2)}`} bold />
            <Row label="Amount Paid" value={`£${(Number(depositPaid) || 0).toFixed(2)}`} />
            <div className="border-t pt-2">
              <Row
                label="Balance Due"
                value={`£${balanceDue.toFixed(2)}`}
                accent
              />
            </div>
            {paymentMethod !== "None" && (
              <div className="text-right text-sm text-muted-foreground pt-1">
                Via {paymentMethod}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/invoices" })}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Update Invoice" : "Create Invoice"}
        </Button>
      </div>
    </form>
  );
}

function Row({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex justify-between text-sm ${bold ? "font-semibold" : ""} ${
        accent ? "text-primary text-base font-bold" : ""
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
