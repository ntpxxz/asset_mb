# Dashboard Asset Type Cards - Implementation Guide

## Overview
This guide shows how to add asset type summary cards at the top of the dashboard, similar to the old UI design.

## Step 1: Update the Dashboard API

First, update `app/api/dashboard/route.ts` to include asset type counts.

Add this function after the `getWarranties` function (around line 99):

```typescript
async function getAssetTypeCounts() {
  try {
    const sql = `
      SELECT
        COUNT(*) FILTER (WHERE type IN ('laptop', 'pc', 'desktop', 'server', 'workstation', 'tablet'))::int AS computer,
        COUNT(*) FILTER (WHERE type IN ('router', 'switch', 'firewall', 'access-point', 'gateway'))::int AS network,
        COUNT(*) FILTER (WHERE type = 'monitor')::int AS monitor,
        COUNT(*) FILTER (WHERE type = 'printer')::int AS printer,
        COUNT(*) FILTER (WHERE type NOT IN ('laptop', 'pc', 'desktop', 'server', 'workstation', 'tablet', 'router', 'switch', 'firewall', 'access-point', 'gateway', 'monitor', 'printer'))::int AS other
      FROM assets;
    `;
    const { rows } = await pool.query(sql);
    return rows[0] || { computer: 0, network: 0, monitor: 0, printer: 0, other: 0 };
  } catch (error) {
    console.error('Error fetching asset type counts:', error);
    return { computer: 0, network: 0, monitor: 0, printer: 0, other: 0 };
  }
}
```

Then update the GET handler to include this data (around line 120-140):

```typescript
export async function GET(request: NextRequest) {
  try {
    const [hardwareStats, computerStats, networkStats, inventoryStats, warranties, assetTypes] = await Promise.all([
      getHardwareStats(),
      getComputerAssets(),
      getNetworkAssets(),
      getInventoryStats(),
      getWarranties(30),
      getAssetTypeCounts(), // Add this line
    ]);

    const stats = {
      hardware: hardwareStats,
      computerAssets: computerStats,
      networkAssets: networkStats,
      inventory: inventoryStats,
      assetTypes, // Add this line
    };

    return NextResponse.json({
      success: true,
      data: { stats, warranties },
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  }
}
```

## Step 2: Update the Dashboard Page

In `app/(app)/dashboard/page.tsx`, add the asset type cards section.

### 2.1: Update the stats state (line 15-20):

```typescript
const [stats, setStats] = useState({
  hardware: { inUse: 0, available: 0, underRepair: 0, retired: 0 },
  computerAssets: { total: 0, laptop: 0, desktop: 0, server: 0 },
  networkAssets: { total: 0, router: 0, switch: 0, other: 0 },
  inventory: { totalItems: 0, totalQuantity: 0, lowStock: 0, outOfStock: 0 },
  assetTypes: { computer: 0, network: 0, monitor: 0, printer: 0, other: 0 }, // Add this line
});
```

### 2.2: Add the asset type cards section (after line 46, before the main grid):

```tsx
{/* Asset Type Summary Cards - Top Section */}
<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
  <Link href="/assets?type=computer">
    <Card className={`hover:shadow-md transition-all cursor-pointer ${loading ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Laptop className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Computer</p>
            <p className="text-2xl font-bold">{stats.assetTypes?.computer || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>

  <Link href="/assets?type=network">
    <Card className={`hover:shadow-md transition-all cursor-pointer ${loading ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Network className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Network</p>
            <p className="text-2xl font-bold">{stats.assetTypes?.network || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>

  <Link href="/assets?type=monitor">
    <Card className={`hover:shadow-md transition-all cursor-pointer ${loading ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Box className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Monitor</p>
            <p className="text-2xl font-bold">{stats.assetTypes?.monitor || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>

  <Link href="/assets?type=printer">
    <Card className={`hover:shadow-md transition-all cursor-pointer ${loading ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Printer</p>
            <p className="text-2xl font-bold">{stats.assetTypes?.printer || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>

  <Link href="/assets">
    <Card className={`hover:shadow-md transition-all cursor-pointer ${loading ? 'opacity-50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 dark:bg-gray-900/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Other</p>
            <p className="text-2xl font-bold">{stats.assetTypes?.other || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
</div>
```

## Result

After implementing these changes, your dashboard will have:

1. **Top Section**: 5 compact cards showing asset counts by type:
   - Computer (blue)
   - Network (purple)
   - Monitor (green)
   - Printer (orange)
   - Other (gray)

2. **Middle Section**: Existing 3-column grid with:
   - Hardware Status
   - Computer Assets Breakdown
   - Network Assets Breakdown

3. **Bottom Section**: Existing 2-column grid with:
   - Inventory/Stock Status
   - Warranty Alerts

## Features

- ✅ Clickable cards that navigate to filtered asset pages
- ✅ Hover effects for better UX
- ✅ Loading state support
- ✅ Dark mode compatible
- ✅ Responsive grid layout (2 columns on mobile, 5 on desktop)
- ✅ Icon-based visual design matching the old UI

## Testing

After implementation:
1. Restart your dev server
2. Navigate to `/dashboard`
3. Verify all asset type counts are displayed correctly
4. Click each card to ensure navigation works
5. Test on mobile to verify responsive layout
