import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.resolve(__dirname, "../../assets/hr-logo.png");

const COMPANY = {
  name: "HR Car Audio & Tints",
  email: "info@hrcaraudio.co.uk",
  phone: "+44 7865 543241",
  hours: "Monday to Saturday 9am to 6pm",
  site: "hrcaraudio.co.uk",
};

export function generateInvoiceBuffer(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      generateHeader(doc);
      const infoBottom = generateCustomerInformation(doc, invoice);
      generateInvoiceTable(doc, invoice, infoBottom);
      generateFooter(doc);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function generateHeader(doc) {
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, 50, 40, { width: 110 });
  } else {
    doc.fillColor("#dc2626").fontSize(22).font("Helvetica-Bold").text("HR CAR AUDIO", 50, 57);
  }

  doc
    .fillColor("#111827")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(COMPANY.name, 200, 50, { align: "right" })
    .font("Helvetica")
    .text(COMPANY.email, 200, 65, { align: "right" })
    .text(COMPANY.phone, 200, 80, { align: "right" })
    .text(COMPANY.site, 200, 95, { align: "right" });
}

function generateCustomerInformation(doc, invoice) {
  doc.fillColor("#000000").fontSize(22).font("Helvetica-Bold").text("INVOICE", 50, 160);
  generateHr(doc, 190);

  const top = 205;
  let leftY = top;
  doc.fontSize(10).fillColor("#374151").font("Helvetica");

  const drawLeft = (label, value) => {
    if (value === undefined || value === null || value === "") return;
    doc.font("Helvetica-Bold").text(label, 50, leftY);
    doc.font("Helvetica").text(String(value), 160, leftY);
    leftY += 15;
  };

  drawLeft("Invoice Number:", invoice.invoiceNumber);
  drawLeft("Invoice Date:", formatDate(invoice.createdAt || new Date()));

  const billToX = 330;
  const billToWidth = 215;
  let rightY = top;

  doc.font("Helvetica-Bold").text("Bill To:", billToX, rightY);
  rightY += 15;
  doc.font("Helvetica");

  const c = invoice.client || {};
  const lines = [
    c.name,
    c.regNo ? `Reg No: ${c.regNo}` : "",
    c.address,
    c.phone ? `Phone: ${c.phone}` : "",
    c.email,
  ].filter(Boolean);

  for (const line of lines) {
    doc.text(line, billToX, rightY, { width: billToWidth });
    rightY = doc.y;
  }

  const lowestY = Math.max(leftY, rightY);
  generateHr(doc, lowestY + 10);
  return lowestY + 10;
}

function generateInvoiceTable(doc, invoice, infoBottom = 295) {
  const tableTop = infoBottom + 25;

  doc.font("Helvetica-Bold").fillColor("#111827");
  generateTableRow(doc, tableTop, "Item", "Unit Price", "Qty", "Line Total");
  generateHr(doc, tableTop + 18);
  doc.font("Helvetica").fillColor("#374151");

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  let position = tableTop + 25;

  items.forEach((item) => {
    const name = item.name || "-";
    const desc = item.description || "";
    const nameHeight = doc.heightOfString(name, { width: 230 });
    const descHeight = desc ? doc.heightOfString(desc, { width: 230 }) : 0;
    const rowHeight = nameHeight + descHeight + 10;

    if (position + rowHeight > 700) {
      doc.addPage();
      position = 50;
    }

    generateTableRow(
      doc,
      position,
      name,
      formatCurrency(item.price || 0),
      item.quantity || 1,
      formatCurrency((item.price || 0) * (item.quantity || 1))
    );

    if (desc) {
      doc
        .font("Helvetica-Oblique")
        .fillColor("#6b7280")
        .fontSize(9)
        .text(desc, 50, position + nameHeight, { width: 230 })
        .font("Helvetica")
        .fillColor("#374151")
        .fontSize(10);
    }

    position += rowHeight;
    generateHr(doc, position - 4);
  });

  let totalY = position + 10;

  if (invoice.subtotal !== invoice.total) {
    generateTableRow(doc, totalY, "", "", "Subtotal", formatCurrency(invoice.subtotal));
    totalY += 20;
  }

  doc.font("Helvetica-Bold").fillColor("#111827");
  generateTableRow(doc, totalY, "", "", "Total", formatCurrency(invoice.total));
  totalY += 22;

  doc.font("Helvetica").fillColor("#374151");
  generateTableRow(doc, totalY, "", "", "Amount Paid", formatCurrency(invoice.depositPaid || 0));
  totalY += 20;

  if (invoice.balanceDue > 0) {
    doc.font("Helvetica-Bold").fillColor("#000000");
    generateTableRow(doc, totalY, "", "", "Balance Due", formatCurrency(invoice.balanceDue));
    totalY += 20;
  }

  if (invoice.paymentMethod && invoice.paymentMethod !== "None") {
    doc.font("Helvetica").fontSize(9).fillColor("#6b7280");
    generateTableRow(doc, totalY, "", "", "Method", invoice.paymentMethod);
    totalY += 20;
    doc.fontSize(10);
  }
  
  totalY += 10;

  if (invoice.notes) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("Notes:", 50, totalY);
    doc
      .font("Helvetica")
      .fillColor("#374151")
      .text(invoice.notes, 50, totalY + 15, { width: 490 });
  }
}

function generateFooter(doc) {
  const terms = `Terms & Conditions:
All labour charges are non-refundable once the work has been completed and approved.
All parts supplied are non-refundable, except where required under your statutory rights.
We offer up to 12 months warranty on selected parts and installations, subject to manufacturer terms and normal usage.
In the event of a faulty item, it will be repaired or replaced on a like-for-like basis under manufacturer warranty.
Faults must be reported within 28 days of installation.
No refunds will be issued for faulty goods unless a repair or replacement is not possible, in line with your consumer rights.
We are not responsible for pre-existing faults in the vehicle, including factory systems, wiring, amplifiers, or previously installed equipment.
Any customer-supplied parts are fitted at the customer’s own risk and are not covered under our warranty.
Warranty does not cover accidental damage, misuse, or wear and tear.
By proceeding with the installation, you agree to the above terms and conditions.`;

  const thankYouY = 760;
  const termsHeight = doc.heightOfString(terms, { width: 500 });
  const termsY = thankYouY - termsHeight - 15;

  doc.fontSize(7).fillColor("#000000").text(terms, 50, termsY, {
    align: "left",
    width: 500,
  });

  doc
    .fontSize(9)
    .fillColor("#000000")
    .text(
      `Thank you for your business. ${COMPANY.hours}`,
      50,
      thankYouY,
      { align: "center", width: 500 }
    );
}

function generateTableRow(doc, y, item, unitCost, quantity, lineTotal) {
  doc
    .fontSize(10)
    .text(item, 50, y, { width: 230 })
    .text(unitCost, 290, y, { width: 70, align: "center" })
    .text(quantity, 360, y, { width: 70, align: "center" })
    .text(lineTotal, 440, y, { width: 90, align: "right" });
}

function generateHr(doc, y) {
  doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, y).lineTo(540, y).stroke();
}

function formatCurrency(value) {
  return `GBP ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
