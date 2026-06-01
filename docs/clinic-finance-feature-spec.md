# Clinic Finance & Inventory Feature Specification

> **Stack:** Laravel · Inertia.js · React · shadcn/ui

---

## Overview

This document describes the design and implementation plan for adding **financial reporting** and **inventory (stock) management** features to the Beauty Clinic application. The scope covers:

- Revenue tracking (gross & net income / P&L report)
- Balance sheet (assets, equity, liabilities)
- Physical stock management (products & supplies)

> **Is this accounting/finance?** Yes — partially. The P&L report and balance sheet are standard **managerial accounting** outputs. Full double-entry bookkeeping is *not* required for a small clinic; a simplified cash-basis or accrual-lite model is sufficient and is what the reference screenshots reflect.

---

## 1. Feature Breakdown

### 1.1 Income Statement (Profit & Loss Report)

Mirrors the first screenshot (tanggal mulai / tanggal selesai).

| Section | Fields |
|---|---|
| **Header** | Start date, End date |
| **Revenue** | Gross revenue (Omset), Returns (Retur), Total Revenue |
| **Cost of Goods Sold (COGS / HPP)** | HPP total, Gross Profit, Gross Margin % |
| **Operating Expenses** | Total operational costs |
| **Net Income** | Laba Bersih |

**Key calculations:**

```
Total Revenue       = Omset - Retur
Gross Profit        = Total Revenue - HPP
Gross Margin (%)    = (Gross Profit / Total Revenue) × 100
Net Income          = Gross Profit - Total Operating Expenses
```

---

### 1.2 Balance Sheet

Mirrors the second screenshot (Asset vs Modal & Hasil Usaha).

| Asset Side | Equity & Liability Side |
|---|---|
| Cash (Kas) | Initial Capital (Modal Awal) |
| Supplier PO (PO Supplier) | Retained Earnings (Laba Ditahan) |
| Physical Stock / Inventory (Stok Fisik - HPP) | Liabilities / Debt (Kewajiban / Hutang) |
| Physical Assets / Equipment (Aset Fisik) | |
| Non-physical Assets / Rent (Aset Non Fisik) | |
| **Total Assets** | **Total Equity + Liabilities** |

**Accounting equation:**

```
Total Assets = Total Equity (Modal Awal + Laba Ditahan) + Total Liabilities
```

---

### 1.3 Inventory / Stock Management

| Feature | Description |
|---|---|
| Product catalog | Name, SKU, category, unit, purchase price (HPP), selling price |
| Stock-in | Record incoming stock from suppliers |
| Stock-out | Auto-deduct on each transaction/sale |
| Physical stock count | Manual adjustment / stockopname |
| Low-stock alert | Notify when quantity falls below threshold |
| Stock valuation | Total inventory value = quantity × HPP |

---

## 2. Database Schema

### 2.1 Migrations

```php
// transactions table (already exists, extend if needed)
Schema::table('transactions', function (Blueprint $table) {
    $table->decimal('return_amount', 15, 2)->default(0);
    $table->decimal('hpp_amount', 15, 2)->default(0); // COGS for this transaction
});

// operating_expenses table
Schema::create('operating_expenses', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('category')->nullable(); // rent, salary, utilities, etc.
    $table->decimal('amount', 15, 2);
    $table->date('expense_date');
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletes();
});

// products table (inventory)
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('sku')->unique();
    $table->string('name');
    $table->string('category')->nullable();
    $table->string('unit')->default('pcs'); // pcs, ml, g, box
    $table->decimal('purchase_price', 15, 2);  // HPP
    $table->decimal('selling_price', 15, 2);
    $table->integer('stock_qty')->default(0);
    $table->integer('min_stock_qty')->default(5); // low-stock threshold
    $table->timestamps();
    $table->softDeletes();
});

// stock_movements table
Schema::create('stock_movements', function (Blueprint $table) {
    $table->id();
    $table->foreignId('product_id')->constrained()->cascadeOnDelete();
    $table->enum('type', ['in', 'out', 'adjustment']);
    $table->integer('quantity');
    $table->decimal('unit_price', 15, 2)->nullable(); // purchase price at time of movement
    $table->string('reference')->nullable();          // invoice no., transaction id, etc.
    $table->text('notes')->nullable();
    $table->date('movement_date');
    $table->timestamps();
});

// balance_sheet_entries table (manual entries for non-transactional items)
Schema::create('balance_sheet_entries', function (Blueprint $table) {
    $table->id();
    $table->enum('side', ['asset', 'equity', 'liability']);
    $table->string('label');               // e.g. "Modal Awal", "PO Supplier"
    $table->string('category')->nullable();
    $table->decimal('amount', 15, 2);
    $table->date('entry_date');
    $table->timestamps();
});
```

---

## 3. Laravel Backend

### 3.1 Models

```php
// app/Models/OperatingExpense.php
class OperatingExpense extends Model {
    use SoftDeletes;
    protected $fillable = ['name', 'category', 'amount', 'expense_date', 'notes'];
    protected $casts = ['expense_date' => 'date', 'amount' => 'decimal:2'];
}

// app/Models/Product.php
class Product extends Model {
    use SoftDeletes;
    protected $fillable = [
        'sku', 'name', 'category', 'unit',
        'purchase_price', 'selling_price', 'stock_qty', 'min_stock_qty'
    ];

    public function stockMovements() {
        return $this->hasMany(StockMovement::class);
    }

    public function isLowStock(): bool {
        return $this->stock_qty <= $this->min_stock_qty;
    }

    public function stockValue(): float {
        return $this->stock_qty * $this->purchase_price;
    }
}

// app/Models/StockMovement.php
class StockMovement extends Model {
    protected $fillable = [
        'product_id', 'type', 'quantity',
        'unit_price', 'reference', 'notes', 'movement_date'
    ];

    protected static function booted(): void {
        static::created(function (StockMovement $movement) {
            $delta = match ($movement->type) {
                'in'         => $movement->quantity,
                'out'        => -$movement->quantity,
                'adjustment' => $movement->quantity, // can be negative
            };
            $movement->product()->increment('stock_qty', $delta);
        });
    }
}
```

### 3.2 Service: FinanceReportService

```php
// app/Services/FinanceReportService.php
namespace App\Services;

use App\Models\Transaction;
use App\Models\OperatingExpense;
use App\Models\Product;

class FinanceReportService
{
    public function getProfitLoss(string $startDate, string $endDate): array
    {
        $revenue = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->sum('total_amount');

        $returns = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->sum('return_amount');

        $hpp = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->sum('hpp_amount');

        $operatingExpenses = OperatingExpense::whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');

        $totalRevenue  = $revenue - $returns;
        $grossProfit   = $totalRevenue - $hpp;
        $grossMargin   = $totalRevenue > 0 ? ($grossProfit / $totalRevenue) * 100 : 0;
        $netIncome     = $grossProfit - $operatingExpenses;

        return compact(
            'revenue', 'returns', 'totalRevenue',
            'hpp', 'grossProfit', 'grossMargin',
            'operatingExpenses', 'netIncome'
        );
    }

    public function getInventoryValue(): float
    {
        return Product::sum(\DB::raw('stock_qty * purchase_price'));
    }
}
```

### 3.3 Controllers

```php
// app/Http/Controllers/Finance/ReportController.php
class ReportController extends Controller
{
    public function profitLoss(Request $request, FinanceReportService $service)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        $data = $service->getProfitLoss($request->start_date, $request->end_date);

        return Inertia::render('Finance/ProfitLoss', $data);
    }
}

// app/Http/Controllers/Finance/InventoryController.php
class InventoryController extends Controller
{
    public function index()
    {
        $products = Product::withCount('stockMovements')
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('Finance/Inventory/Index', [
            'products'  => $products,
            'lowStock'  => Product::where('stock_qty', '<=', DB::raw('min_stock_qty'))->count(),
        ]);
    }

    public function addStock(Request $request, Product $product)
    {
        $request->validate([
            'quantity'      => 'required|integer|min:1',
            'unit_price'    => 'required|numeric|min:0',
            'reference'     => 'nullable|string|max:100',
            'movement_date' => 'required|date',
        ]);

        StockMovement::create([
            'product_id'    => $product->id,
            'type'          => 'in',
            ...$request->only(['quantity', 'unit_price', 'reference', 'notes', 'movement_date']),
        ]);

        return back()->with('success', 'Stock updated successfully.');
    }
}
```

### 3.4 Routes

```php
// routes/web.php

// Read-only finance access: Super Admin + Doctor
Route::prefix('finance')->name('finance.')->middleware(['auth', 'role:super_admin|doctor'])->group(function () {
    Route::get('profit-loss',   [ReportController::class, 'profitLoss'])->name('profit-loss');
    Route::get('balance-sheet', [ReportController::class, 'balanceSheet'])->name('balance-sheet');

    // Inventory: both roles can view
    Route::get('inventory',              [InventoryController::class, 'index'])->name('inventory.index');
    Route::get('inventory/{product}',    [InventoryController::class, 'show'])->name('inventory.show');

    // Write operations: Super Admin only
    Route::middleware('role:super_admin')->group(function () {
        Route::resource('expenses', OperatingExpenseController::class)->except('index', 'show');
        Route::post('inventory',                             [InventoryController::class, 'store']);
        Route::put('inventory/{product}',                   [InventoryController::class, 'update']);
        Route::delete('inventory/{product}',                [InventoryController::class, 'destroy']);
        Route::post('inventory/{product}/stock-in',         [InventoryController::class, 'addStock']);
        Route::post('inventory/{product}/stock-out',        [InventoryController::class, 'removeStock']);
        Route::post('inventory/{product}/adjust',           [InventoryController::class, 'adjust']);
        Route::get('expenses',                              [OperatingExpenseController::class, 'index'])->name('expenses.index');
    });
});

// Admin is explicitly excluded — no finance routes are accessible to the admin role.
```

---

## 4. React / Inertia Frontend (shadcn/ui)

### 4.1 Page Structure

```
resources/js/Pages/Finance/
├── ProfitLoss.tsx          ← P&L report with date range picker
├── BalanceSheet.tsx        ← Asset vs Equity/Liability table
├── Inventory/
│   ├── Index.tsx           ← Product list + stock badge
│   ├── Create.tsx          ← Add new product
│   └── StockMovement.tsx   ← Stock-in / stock-out modal
└── Expenses/
    ├── Index.tsx
    └── Form.tsx
```

### 4.2 P&L Report Component

```tsx
// resources/js/Pages/Finance/ProfitLoss.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ProfitLossProps = {
  revenue: number;
  returns: number;
  totalRevenue: number;
  hpp: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  netIncome: number;
  startDate: string;
  endDate: string;
};

export default function ProfitLoss(props: ProfitLossProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-4 p-6">
      {/* Date Range Picker (use shadcn DateRangePicker or react-day-picker) */}

      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Row label="Gross Revenue (Omset)" value={fmt(props.revenue)} />
          <Row label="Returns (Retur)" value={fmt(props.returns)} />
          <Row label="Total Revenue" value={fmt(props.totalRevenue)} bold />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cost of Goods Sold (HPP)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Row label="HPP" value={fmt(props.hpp)} />
          <Row label="Gross Profit" value={fmt(props.grossProfit)} bold />
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Gross Margin</span>
            <Badge variant="outline" className="text-green-600">
              {props.grossMargin.toFixed(2)}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Operating Expenses</CardTitle></CardHeader>
        <CardContent>
          <Row label="Total Operating Expenses" value={fmt(props.operatingExpenses)} />
        </CardContent>
      </Card>

      <Card className="border-2 border-primary">
        <CardContent className="pt-4">
          <Row label="Net Income (Laba Bersih)" value={fmt(props.netIncome)} bold large />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, bold = false, large = false }: {
  label: string; value: string; bold?: boolean; large?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? "font-semibold" : "text-muted-foreground"} ${large ? "text-base" : ""}`}>
        {label}
      </span>
      <span className={`text-sm ${bold ? "font-bold" : ""} ${large ? "text-base" : ""}`}>
        {value}
      </span>
    </div>
  );
}
```

### 4.3 Inventory Index Component (simplified)

```tsx
// resources/js/Pages/Finance/Inventory/Index.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function InventoryIndex({ products, lowStock }) {
  const fmt = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 space-y-4">
      {lowStock > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md text-sm">
          ⚠️ {lowStock} product(s) are running low on stock.
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Purchase Price (HPP)</TableHead>
            <TableHead>Stock Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.data.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-mono text-xs">{product.sku}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.stock_qty} {product.unit}</TableCell>
              <TableCell>{fmt(product.purchase_price)}</TableCell>
              <TableCell>{fmt(product.stock_qty * product.purchase_price)}</TableCell>
              <TableCell>
                {product.stock_qty <= product.min_stock_qty
                  ? <Badge variant="destructive">Low Stock</Badge>
                  : <Badge variant="secondary">OK</Badge>
                }
              </TableCell>
              <TableCell>
                <Button size="sm" variant="outline">Stock In</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## 5. Navigation Integration

Add these links to your sidebar/nav. The Finance section is **only rendered for `super_admin` and `doctor`** — hidden entirely from `admin`.

```tsx
// Sidebar nav items — conditionally rendered by role
// Assumes `auth.user.roles` is shared via Inertia HandleInertiaRequests middleware

const { auth } = usePage<{ auth: { user: { roles: string[] } } }>().props;
const isSuperAdmin = auth.user.roles.includes('super_admin');
const isDoctor     = auth.user.roles.includes('doctor');
const canViewFinance = isSuperAdmin || isDoctor;

// Only render this nav group if the user has access
{canViewFinance && {
  title: "Finance",
  icon: <TrendingUp />,
  children: [
    { title: "Profit & Loss",   href: route("finance.profit-loss") },
    { title: "Balance Sheet",   href: route("finance.balance-sheet") },
    { title: "Inventory",       href: route("finance.inventory.index") },
    // Expenses management: Super Admin only
    ...(isSuperAdmin ? [{ title: "Expenses", href: route("finance.expenses.index") }] : []),
  ]
}}
```

---

## 6. Permissions (Spatie Laravel Permission — if used)

```php
// Suggested permissions
$permissions = [
    'finance.view',         // view P&L and balance sheet
    'finance.export',       // export to PDF/Excel
    'expenses.manage',      // create/edit/delete expenses
    'inventory.view',       // view stock list
    'inventory.manage',     // stock-in, stock-out, adjustment
];

// Super Admin — full access to all finance features
Role::findByName('super_admin')->givePermissionTo($permissions);

// Doctor — read-only access to finance reports and inventory
Role::findByName('doctor')->givePermissionTo([
    'finance.view',
    'inventory.view',
]);

// Admin — explicitly NOT granted any finance permissions
// Role::findByName('admin') receives none of the above
```

> **Access matrix:**
>
> | Permission | Super Admin | Doctor | Admin |
> |---|:---:|:---:|:---:|
> | View P&L & Balance Sheet | ✅ | ✅ | ❌ |
> | Export reports | ✅ | ❌ | ❌ |
> | Manage expenses | ✅ | ❌ | ❌ |
> | View inventory / stock | ✅ | ✅ | ❌ |
> | Stock-in / Stock-out / Adjust | ✅ | ❌ | ❌ |

---

## 7. Optional Enhancements

| Enhancement | Notes |
|---|---|
| **PDF export** | Use `barryvdh/laravel-dompdf` to export P&L and balance sheet |
| **Date range presets** | This month / Last month / This year buttons in the UI |
| **Chart overlay** | Monthly revenue bar chart using `recharts` |
| **Multi-branch** | Add `branch_id` FK to transactions, expenses, and stock movements |
| **Supplier management** | Track supplier invoices linked to stock-in movements |
| **FIFO costing** | Calculate HPP using First-In-First-Out instead of a flat purchase price |

---

## 8. Summary Checklist

- [ ] Run migrations for `operating_expenses`, `products`, `stock_movements`, `balance_sheet_entries`
- [ ] Create `FinanceReportService`
- [ ] Create controllers: `ReportController`, `InventoryController`, `OperatingExpenseController`
- [ ] Register routes under `/finance`
- [ ] Build Inertia pages: `ProfitLoss`, `BalanceSheet`, `Inventory/Index`, `Expenses/Index`
- [ ] Add Finance section to sidebar navigation
- [ ] Assign permissions to roles
- [ ] (Optional) PDF export for reports
