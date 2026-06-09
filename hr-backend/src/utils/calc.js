export function computeTotals(items = [], depositPaid = 0, paymentMethod = "None") {
  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1),
    0
  );
  const total = subtotal; // no tax
  const deposit = Math.max(0, Number(depositPaid || 0));
  const balanceDue = +(total - deposit).toFixed(2);
  
  let paymentStatus = "Unpaid";
  if (deposit > 0 && balanceDue > 0) paymentStatus = "Partial/Deposit";
  if (deposit > 0 && balanceDue <= 0) paymentStatus = "Fully Paid";

  return {
    subtotal: +subtotal.toFixed(2),
    total: +total.toFixed(2),
    depositPaid: +deposit.toFixed(2),
    balanceDue,
    paymentStatus,
    paymentMethod
  };
}

export function generateInvoiceNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `AC-${ymd}-${rand}`;
}
