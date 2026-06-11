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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import type { Invoice } from "@/lib/types";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/invoices/")({
  component: InvoicesListPage,
});

function fmt(n: number) {
  return `£${Number(n || 0).toFixed(2)}`;
}

function InvoicesListPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ invoices: Invoice[] }>("/api/invoices");
      setInvoices(res.invoices);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    try {
      await api(`/api/invoices/${id}`, { method: "DELETE" });
      toast.success("Invoice deleted");
      setInvoices((prev) => prev.filter((i) => i._id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Manage all customer invoices for Car Audio & Customs.
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/invoices/new" })}>
          <Plus className="h-4 w-4 mr-1" /> New Invoice
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right hidden md:table-cell">Total</TableHead>
              <TableHead className="text-right hidden md:table-cell">Paid</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No invoices yet. Click "New Invoice" to create one.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv._id}>
                  <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                  <TableCell className="font-medium">{inv.client?.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                    {new Date(inv.createdAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">{fmt(inv.total)}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{fmt(inv.depositPaid)}</TableCell>
                  <TableCell className="text-right">
                    {inv.balanceDue > 0 ? (
                      <Badge variant="destructive">{fmt(inv.balanceDue)}</Badge>
                    ) : (
                      <Badge variant="secondary">£0.00</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    {inv.balanceDue <= 0 ? (
                      <Badge>Fully Paid</Badge>
                    ) : inv.depositPaid > 0 ? (
                      <Badge variant="outline">Deposit Paid</Badge>
                    ) : (
                      <Badge variant="secondary">Unpaid</Badge>
                    )}
                    {inv.paymentMethod && inv.paymentMethod !== "None" && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {inv.paymentMethod}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Link to="/invoices/$id" params={{ id: inv._id }}>
                        <Button size="icon" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to="/invoices/$id/edit" params={{ id: inv._id }}>
                        <Button size="icon" variant="ghost">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {inv.invoiceNumber} will be permanently removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(inv._id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
