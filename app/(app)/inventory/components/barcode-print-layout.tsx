"use client";

import React from "react";
import Barcode from "react-barcode";

interface BarcodePrintLayoutProps {
  items: Array<{
    id: number;
    name: string;
    barcode: string | null;
  }>;
}

export const BarcodePrintLayout = React.forwardRef<
  HTMLDivElement,
  BarcodePrintLayoutProps
>(({ items }, ref) => {
  if (!items || items.length === 0) {
    return (
      <div ref={ref}>
        <p>No items to print.</p>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="p-4"
      // IMPORTANT: don't use display: none here. If you hide this element,
      // barcode rendering may not happen. Use offscreen positioning if you want it hidden from view:
      // style={{ position: "absolute", left: -9999, top: -9999 }}
    >
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 5mm; }
          body { -webkit-print-color-adjust: exact; }
          .label-container { 
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          .label {
            width: 300px;
            height: 150px;
            border: 1px dashed #ccc;
            padding: 10px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            page-break-inside: avoid;
          }
          .item-name {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            word-break: break-word;
          }
          /* Ensure SVG scales nicely */
          .barcode-svg {
            max-width: 100%;
            height: auto;
            display: block;
          }
        `}
      </style>

      <div className="label-container">
        {items.map((item) => (
          <div key={item.id} className="label" data-item-id={item.id}>
            <p className="item-name">{item.name}</p>

            {item.barcode ? (
              <>
                {/* Render barcode as SVG — hide the built-in number so we can show styled text ourselves */}
                <Barcode
                  value={item.barcode}
                  width={1}           // tune line width
                  height={50}
                  fontSize={12}
                  displayValue={false} // hide the numeric text rendered by the barcode lib
                  renderer="svg"       // <-- ensure SVG output
                  className="barcode-svg"
                />

                {/* show the numeric value as text under the SVG */}
                <div style={{ marginTop: 6, fontSize: 16 }}>{item.barcode}</div>
              </>
            ) : (
              <p className="text-red-500 text-sm">No Barcode</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

BarcodePrintLayout.displayName = "BarcodePrintLayout";
