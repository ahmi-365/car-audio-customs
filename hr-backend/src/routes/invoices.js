import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Invoice from "../models/Invoice.js";
import { computeTotals, generateInvoiceNumber } from "../utils/calc.js";
import { sendTemplatedEmail } from "../utils/emailService.js";
import { generateInvoiceBuffer } from "../utils/pdf.js";

const router = Router();
router.use(requireAuth);

function sanitizeItems(items = []) {
  return items
    .filter((i) => i && i.name && Number(i.price) >= 0)
    .map((i) => ({
      name: String(i.name).trim(),
      description: i.description ? String(i.description).trim() : "",
      price: Number(i.price) || 0,
      quantity: Math.max(1, Number(i.quantity) || 1),
    }));
}

function buildPayload(body) {
  const items = sanitizeItems(body.items || []);
  const totals = computeTotals(items, body.depositPaid || 0, body.paymentMethod || "None");
  return {
    client: {
      name: String(body.client?.name || "").trim(),
      regNo: String(body.client?.regNo || "").trim(),
      address: String(body.client?.address || "").trim(),
      phone: String(body.client?.phone || "").trim(),
      email: String(body.client?.email || "").trim(),
    },
    items,
    notes: String(body.notes || "").trim(),
    ...totals,
  };
}

router.get("/", async (_req, res) => {
  const invoices = await Invoice.find().sort({ createdAt: -1 }).limit(500);
  res.json({ invoices });
});

router.get("/:id", async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: "Not found" });
  res.json({ invoice });
});

router.post("/", async (req, res) => {
  const payload = buildPayload(req.body || {});
  if (!payload.client.name) return res.status(400).json({ message: "Client name required" });
  if (!payload.items.length) return res.status(400).json({ message: "Add at least one product" });

  const invoice = await Invoice.create({
    ...payload,
    invoiceNumber: req.body?.invoiceNumber || generateInvoiceNumber(),
    createdBy: req.user?.sub,
  });
  res.status(201).json({ invoice });
});

router.put("/:id", async (req, res) => {
  const payload = buildPayload(req.body || {});
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!invoice) return res.status(404).json({ message: "Not found" });
  res.json({ invoice });
});

router.delete("/:id", async (req, res) => {
  const r = await Invoice.findByIdAndDelete(req.params.id);
  if (!r) return res.status(404).json({ message: "Not found" });
  res.json({ ok: true });
});

router.get("/:id/pdf", async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: "Not found" });
  const buffer = await generateInvoiceBuffer(invoice.toObject());
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${invoice.invoiceNumber}.pdf"`
  );
  res.send(buffer);
});

router.post("/:id/email", async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: "Not found" });
  const to = req.body?.to || invoice.client?.email;
  if (!to) return res.status(400).json({ message: "Recipient email required" });

  const buffer = await generateInvoiceBuffer(invoice.toObject());
  
  try {
    const result = await sendTemplatedEmail({
      type: "invoice_notification",
      to,
      data: {
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client?.name,
        date: invoice.date,
        total: invoice.total,
        depositPaid: invoice.depositPaid,
        balanceDue: invoice.balanceDue,
        message: req.body?.message,
      },
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: buffer,
          contentType: "application/pdf",
        },
      ],
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    res.json({ message: "Email sent" });
  } catch (error) {
    console.error("Email failed:", error);
    res.status(500).json({ message: `Email failed: ${error.message}` });
  }
});

export default router;
