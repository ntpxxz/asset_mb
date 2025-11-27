// app/(app)/assets/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import AssetsClientPage from './components/assets-client-page'; // <-- Import component ใหม่
import pool from '@/lib/db'; // <-- Import pool โดยตรง
import type { AssetFormData } from "@/lib/data-store";

// --- 1. Helper function (ใหม่) เพื่ออ่าน searchParams ---
function getQueryParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) {
    return param[0]; // เอาค่าแรกถ้ามันเป็น Array
  }
  return param; // คืนค่า string หรือ undefined
}

// --- 2. แก้ไข getAssets ให้อ่าน searchParams ถูกต้อง ---
async function getAssets(searchParams: { [key: string]: string | string[] | undefined }): Promise<{ assets: AssetFormData[], total: number }> {
  try {
    // ใช้ Helper function ในการอ่านค่า
    const limit = Number(getQueryParam(searchParams['limit']) || 20);
    const offset = Number(getQueryParam(searchParams['offset']) || 0);
    const status = getQueryParam(searchParams['status']);
    const type = getQueryParam(searchParams['type']);
    const search = getQueryParam(searchParams['search']); // <-- รับค่า search
    
    const params: any[] = [];
    const conds: string[] = [];
    
    if (status && status !== 'all') { 
      params.push(status); 
      conds.push(`a.status = $${params.length}`); 
    }
    if (type && type !== 'all')   { 
      params.push(type);   
      conds.push(`a.type   = $${params.length}`); 
    }
    if (search) {
      params.push(`%${search}%`);
      const searchIndex = params.length;
      conds.push(
        `(
          a.model ILIKE $${searchIndex} OR 
          a.manufacturer ILIKE $${searchIndex} OR 
          a.serialnumber ILIKE $${searchIndex} OR 
          a.assigneduser ILIKE $${searchIndex} OR
          a.asset_tag ILIKE $${searchIndex}
        )`
      );
    }
    
    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    // --- Query 1: นับจำนวนทั้งหมด ---
    const totalQuery = `SELECT COUNT(*) FROM assets a ${whereSql}`;
    // (Error 'pg-main' ของคุณเกิดขึ้นที่บรรทัดถัดไปนี้ ถ้ายังไม่ได้แก้ .env.local)
    const totalResult = await pool.query(totalQuery, params); 
    const total = parseInt(totalResult.rows[0].count, 10);
    
    // --- Query 2: ดึงข้อมูลตามหน้า ---
    params.push(limit, offset);
    const sql = `
      SELECT a.*
      FROM assets a
      ${whereSql}
      ORDER BY a.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    
    const result = await pool.query(sql, params);
    
    // แปลง Date ให้เป็น string ที่ปลอดภัยสำหรับส่งข้าม Server/Client
    const assets = result.rows.map(row => ({
      ...row,
      purchasedate: row.purchasedate ? new Date(row.purchasedate).toISOString() : null,
      warrantyexpiry: row.warrantyexpiry ? new Date(row.warrantyexpiry).toISOString() : null,
      lastpatch_check: row.lastpatch_check ? new Date(row.lastpatch_check).toISOString() : null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      // แปลง purchaseprice เป็น number (ถ้ามันเป็น string)
      purchaseprice: row.purchaseprice ? parseFloat(row.purchaseprice) : null,
    }));

    return { assets: assets as AssetFormData[], total };
  } catch (error) {
    // Log error ฝั่ง server
    console.error("Failed to fetch assets on server:", error);
    // คืนค่าว่างเพื่อไม่ให้หน้าแครช (แต่ error จะถูก log ไว้)
    return { assets: [], total: 0 };
  }
}

// --- 3. แก้ไข Page Component ---
export default async function AssetsServerPage({
  searchParams,
}: {
  // ประเภท prop ที่ถูกต้องสำหรับ searchParams
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  
  // 4. ดึงข้อมูลบน Server (ส่ง searchParams เข้าไปตรงๆ)
  const initialData = await getAssets(searchParams);

  // 5. ส่งข้อมูล (initialData) ให้ Client Component
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading Assets...</span>
      </div>
    }>
      <AssetsClientPage initialData={initialData} />
    </Suspense>
  );
}