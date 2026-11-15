// "Save as PDF": renders a clean document into a hidden iframe and opens the
// print dialog. An iframe (rather than a new tab) works without pop-up
// permission and also when the demo is embedded in another page.

export function esc(s: string): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

const STYLE = `
  *{box-sizing:border-box;}
  body{font-family:Georgia,'Times New Roman',serif; color:#241d12; margin:40px; line-height:1.5;}
  .k{font-family:ui-monospace,Menlo,monospace; font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:#a3451c; margin:26px 0 6px;}
  .k:first-child{margin-top:0;}
  h1{font-size:25px; margin:0 0 4px; line-height:1.15;}
  h2{font-size:17px; margin:0 0 10px;}
  .sub{color:#6b5d4c; margin:0 0 6px; font-size:13px;}
  table{border-collapse:collapse; width:100%; margin-top:6px;}
  th,td{border:1px solid #cbb99d; padding:8px 10px; text-align:left; vertical-align:top; font-size:13px;}
  th{background:#efe6d6; font-size:11.5px; letter-spacing:.03em;}
  td.q{background:#faf5ec; color:#6b5d4c; width:28%;}
  td.ghost, span.ghost{color:#a3957f; font-style:italic;}
  .cols{display:grid; grid-template-columns:repeat(3,1fr); gap:10px;}
  .col{border-radius:10px; padding:10px 12px; break-inside:avoid;}
  .col h3{font-size:14px; margin:0 0 6px;}
  .col ul{margin:0; padding-left:16px; font-size:13px;}
  .yes{background:#e2ecd6;} .maybe{background:#f2e7c7;} .no{background:#f2ddd4;}
  .bps{display:grid; grid-template-columns:repeat(3,1fr); gap:10px;}
  .bp{border:1px solid #e0d3bd; border-radius:10px; padding:10px 12px; background:#faf5ec; font-size:13px;}
  .bp b{display:block; font-family:ui-monospace,Menlo,monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:#6b5d4c; margin-bottom:4px; font-weight:600;}
  .foot{margin-top:30px; color:#8a7a63; font-size:10.5px; border-top:1px solid #e0d3bd; padding-top:10px;}
  @media print{ body{margin:0.45in;} }
`;

export function printHtml(title: string, bodyHtml: string): void {
  const old = document.getElementById("demo-print-frame");
  if (old) old.remove();
  const frame = document.createElement("iframe");
  frame.id = "demo-print-frame";
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${STYLE}</style></head><body>${bodyHtml}</body></html>`);
  doc.close();
  setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  }, 250);
}
