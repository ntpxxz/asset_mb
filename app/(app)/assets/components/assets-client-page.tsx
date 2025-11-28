// app/(app)/assets/components/assets-client-page.tsx
// app/(app)/assets/components/assets-client-page.tsx
"use client";

/**
 * Legacy wrapper kept for backward compatibility.
 * It simply renders the new reusable `AssetList` component.
 * If you need a pre‑filtered view, pass `defaultCategory` via props.
 */
import AssetList from "./AssetList";

export default function AssetsClientPage({ initialData }: any) {
  // No defaultCategory – this page shows all assets (same as before)
  return <AssetList initialData={initialData} />;
}