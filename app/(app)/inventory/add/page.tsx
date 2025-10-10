"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import InventoryForm from "../components/forms/inventory-form"; // <-- สร้างไฟล์นี้ในขั้นตอนถัดไป

export default function AddInventoryPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add or Receive Stock</h1>
          <p className="text-gray-600">Create a new inventory item or add quantity to existing stock.</p>
        </div>
      </div>

      <InventoryForm onSave={() => router.push('/inventory')} />
    </div>
  );
}