const INVOICES = [
  { id: 'net-90', term: 'Net 90', invoiceNo: 'INV-2090', layer: 'back' },
  { id: 'net-60', term: 'Net 60', invoiceNo: 'INV-2060', layer: 'mid' },
  { id: 'net-30', term: 'Net 30', invoiceNo: 'INV-2030', layer: 'front' }
];

function InvoiceHeader({ term, invoiceNo, layer }) {
  return (
    <article className={`magic-bento-card__invoice-header magic-bento-card__invoice-header--${layer}`}>
      <div className="magic-bento-card__invoice-header-top">
        <span className="magic-bento-card__invoice-term">{term}</span>
        <span className="magic-bento-card__invoice-no">{invoiceNo}</span>
      </div>
    </article>
  );
}

export default function CreditTermsInvoiceDecor() {
  return (
    <div className="magic-bento-card__invoice-stack" aria-hidden="true">
      {INVOICES.map((invoice) => (
        <InvoiceHeader key={invoice.id} term={invoice.term} invoiceNo={invoice.invoiceNo} layer={invoice.layer} />
      ))}
    </div>
  );
}
