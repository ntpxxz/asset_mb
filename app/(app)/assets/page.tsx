// app/(app)/assets/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import AssetsClientPage from './components/assets-client-page';
import pool from '@/lib/db';
import type { AssetFormData } from "@/lib/data-store";

// Helper function to read searchParams
function getQueryParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) {
    return param[0];
  }
  return param;
}

// Server-side data fetching
async function getAssets(searchParams: { [key: string]: string | string[] | undefined }): Promise<{ assets: AssetFormData[], total: number }> {
  try {
    const limit = Number(getQueryParam(searchParams['limit']) || 20);
    const offset = Number(getQueryParam(searchParams['offset']) || 0);
    const status = getQueryParam(searchParams['status']);
    const type = getQueryParam(searchParams['type']);
    const search = getQueryParam(searchParams['search']);

    const params: any[] = [];
    const conds: string[] = [];

    // Status Filter
    if (status && status !== 'all') {
      params.push(status);
      conds.push(`a.status = $${params.length}`);
    }

    // Type Filter (including virtual categories)
    if (type && type !== 'all') {
      if (type === 'computer') {
        const computerTypes = ['laptop', 'desktop', 'phone', 'tablet', 'PC'];
        params.push(computerTypes);
        conds.push(`a.type = ANY($${params.length}::text[])`);
      } else if (type === 'network') {
        const networkTypes = ['router', 'switch', 'monitor', 'server'];
        params.push(networkTypes);
        conds.push(`a.type = ANY($${params.length}::text[])`);
      } else {
        params.push(type);
        conds.push(`a.type = $${params.length}`);
      }
    }

    // Search Filter
    if (search) {
      params.push(`%${search}%`);
      const searchIndex = params.length;
      conds.push(
        `(
          a.model ILIKE $${searchIndex} OR 
          a.manufacturer ILIKE $${searchIndex} OR 
          a.serialnumber ILIKE $${searchIndex} OR 
          a.assigneduser ILIKE $${searchIndex} OR
          a.asset_tag ILIKE $${searchIndex} OR
          a.hostname ILIKE $${searchIndex} OR
          a.ipaddress ILIKE $${searchIndex} OR
          a.macaddress ILIKE $${searchIndex} OR
          a.location ILIKE $${searchIndex}
        )`
      );
    }

    const whereSql = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    // Query 1: Count total
    const totalQuery = `SELECT COUNT(*) FROM assets a ${whereSql}`;
    const totalResult = await pool.query(totalQuery, params);
    const total = parseInt(totalResult.rows[0].count, 10);

    // Query 2: Fetch data
    params.push(limit, offset);
    const sql = `
      SELECT
        a.*,
        u.firstname AS assigned_firstname,
        u.employee_id AS assigned_employee_id_resolved,
        COALESCE(u.firstname, a.assigneduser, '-') AS assigneduser
      FROM assets a
      LEFT JOIN users u ON a.assigneduser = u.employee_id
      ${whereSql}
      ORDER BY a.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await pool.query(sql, params);

    // Map data
    const assets = result.rows.map(row => ({
      ...row,
      ip_address: row.ipaddress,
      mac_address: row.macaddress,
      purchasedate: row.purchasedate ? new Date(row.purchasedate).toISOString() : null,
      warrantyexpiry: row.warrantyexpiry ? new Date(row.warrantyexpiry).toISOString() : null,
      lastpatch_check: row.lastpatch_check ? new Date(row.lastpatch_check).toISOString() : null,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null,
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      purchaseprice: row.purchaseprice ? parseFloat(row.purchaseprice) : null,
      assigned_firstname: row.assigned_firstname ?? null,
      assigned_employee_id: row.assigned_employee_id_resolved ?? null,
    }));

    return { assets: assets as AssetFormData[], total };
  } catch (error) {
    console.error("Failed to fetch assets on server:", error);
    return { assets: [], total: 0 };
  }
}

// Page Component - Next.js 15 compatible
export default async function AssetsServerPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const initialData = await getAssets(searchParams);

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