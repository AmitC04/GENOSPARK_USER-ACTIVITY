import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, Download, FileText, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

type OrderStatus = 'completed' | 'pending' | 'failed' | 'refunded';

const STATUS_LABEL: Record<OrderStatus, string> = {
  completed: 'Paid',
  pending:   'Pending',
  failed:    'Failed',
  refunded:  'Refunded',
};

const STATUS_STYLE: Record<string, string> = {
  Paid:     'bg-green-100 text-green-800',
  Pending:  'bg-yellow-100 text-yellow-800',
  Failed:   'bg-red-100 text-red-800',
  Refunded: 'bg-gray-100 text-gray-800',
};

const STATUS_ICON: Record<string, string> = {
  Paid: '✓', Pending: '⏳', Failed: '✗', Refunded: '↩',
};

export function OrdersPage() {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orders,        setOrders]        = useState<any[]>([]);
  const [dateFilter,    setDateFilter]    = useState('30days');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [loading,       setLoading]       = useState(true);
  const [csvOpen,       setCsvOpen]       = useState(false);
  const [invoiceOpen,   setInvoiceOpen]   = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);

  useEffect(() => {
    apiClient.orders
      .getAll({ limit: 100 })
      .then(res => setOrders(res.data?.data?.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const cutoffs: Record<string, Date> = {
    '7days':  new Date(now.getTime() -  7 * 86400000),
    '30days': new Date(now.getTime() - 30 * 86400000),
    '90days': new Date(now.getTime() - 90 * 86400000),
    'all':    new Date(0),
  };

  const filtered = orders.filter(o => {
    const dateOk   = new Date(o.createdAt) >= cutoffs[dateFilter];
    const label    = STATUS_LABEL[o.status as OrderStatus] ?? o.status;
    const statusOk = statusFilter === 'all' || label.toLowerCase() === statusFilter;
    return dateOk && statusOk;
  });

  const paidOrders  = orders.filter(o => o.status === 'completed');
  const totalSpent  = paidOrders.reduce((s: number, o: any) => s + (o.totalAmount ?? 0), 0);
  const avgOrder    = paidOrders.length > 0 ? totalSpent / paidOrders.length : 0;
  const refundCount = orders.filter(o => o.status === 'refunded').length;

  const getStatusBadge = (rawStatus: string) => {
    const label = STATUS_LABEL[rawStatus as OrderStatus] ?? 'Unknown';
    return (
      <Badge variant="secondary" className={STATUS_STYLE[label] ?? 'bg-gray-100 text-gray-800'}>
        {STATUS_ICON[label] ?? '?'} {label}
      </Badge>
    );
  };

  // ── CSV export ──────────────────────────────────────────────────
  const handleExportCSV = () => {
    const rows = [
      ['Order ID', 'Date', 'Items', 'Amount', 'Status', 'Payment Method', 'Transaction ID'],
      ...filtered.map(o => [
        o.orderNumber ?? o.id,
        formatDate(o.createdAt),
        (o.items ?? []).map((it: any) => it.course?.title ?? 'Unknown').join(' | '),
        formatCurrency(o.totalAmount),
        STATUS_LABEL[o.status as OrderStatus] ?? o.status,
        o.paymentMethod ?? '',
        o.paymentId ?? '',
      ]),
    ];
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setCsvOpen(false);
    toast.success('CSV exported successfully');
  };

  // ── Invoice text generator ──────────────────────────────────────
  const generateInvoiceText = (order: any): string => {
    const lines = [
      '═══════════════════════════════════════',
      '           GENOSPARK INVOICE           ',
      '═══════════════════════════════════════',
      `Order ID  : ${order.orderNumber ?? order.id}`,
      `Date      : ${formatDate(order.createdAt)}`,
      `Status    : ${STATUS_LABEL[order.status as OrderStatus] ?? order.status}`,
      '───────────────────────────────────────',
      'ITEMS',
      '───────────────────────────────────────',
      ...(order.items ?? []).map((it: any) =>
        `  ${(it.course?.title ?? 'Unknown').padEnd(28)} ${formatCurrency(it.price)}`
      ),
      '───────────────────────────────────────',
      `  TOTAL${' '.repeat(29)}${formatCurrency(order.totalAmount)}`,
      '═══════════════════════════════════════',
      order.paymentMethod ? `Payment  : ${order.paymentMethod}` : '',
      order.paymentId     ? `Trans ID : ${order.paymentId}`     : '',
      '═══════════════════════════════════════',
      'Thank you for learning with GenoSpark!',
    ].filter(Boolean);
    return lines.join('\n');
  };

  const handleDownloadInvoice = (order: any) => {
    const text = generateInvoiceText(order);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `invoice-${order.orderNumber ?? order.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Invoice downloaded for ${order.orderNumber ?? order.id}`);
  };

  const handleDownloadAllInvoices = () => {
    const paidOrders2 = filtered.filter(o => o.status === 'completed');
    if (paidOrders2.length === 0) { toast.error('No paid orders to download.'); setInvoiceOpen(false); return; }
    const combined = paidOrders2.map(o => generateInvoiceText(o)).join('\n\n\n');
    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `all-invoices-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setInvoiceOpen(false);
    toast.success(`${paidOrders2.length} invoice(s) downloaded`);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl mb-2" style={{ color: '#2c3e50', fontWeight: 'bold' }}>Order History</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />
        <Button variant="outline" onClick={() => setCsvOpen(true)}><Download className="size-4 mr-2" /> Export CSV</Button>
        <Button variant="outline" onClick={() => setInvoiceOpen(true)}><Download className="size-4 mr-2" /> Download Invoices</Button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading orders…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">No orders found.</TableCell>
                  </TableRow>
                ) : filtered.map(order => [
                  <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell>
                      <span className="text-blue-600" style={{ fontWeight: 500 }}>{order.orderNumber}</span>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{order.items?.length ?? 0} items</Badge>
                    </TableCell>
                    <TableCell style={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" title="Download Invoice" onClick={() => handleDownloadInvoice(order)}><Download className="size-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                          {expandedOrder === order.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>,
                  expandedOrder === order.id && (
                    <TableRow key={`${order.id}-details`}>
                      <TableCell colSpan={6} className="bg-gray-50">
                        <div className="p-4 space-y-2">
                          <p className="text-sm" style={{ color: '#2c3e50', fontWeight: 600 }}>Order Details:</p>
                          {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm text-gray-700 pl-4">
                              <span>├─ {item.course?.title ?? 'Unknown'}</span>
                              <span>{formatCurrency(item.price)}</span>
                            </div>
                          ))}
                          <div className="text-sm text-gray-700 pl-4 pt-2 border-t mt-2">
                            {order.paymentMethod && <p>├─ Payment Method: {order.paymentMethod}</p>}
                            {order.paymentId    && <p>├─ Transaction ID: {order.paymentId}</p>}
                            <p>└─ Order Date: {formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
                ])}
              </TableBody>
            </Table>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg mb-4" style={{ color: '#2c3e50', fontWeight: 600 }}>Summary</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                <p className="text-2xl" style={{ color: '#2c3e50', fontWeight: 'bold' }}>{formatCurrency(totalSpent)}</p>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Orders:</span>
                  <span style={{ color: '#2c3e50', fontWeight: 600 }}>{orders.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Order:</span>
                  <span style={{ color: '#2c3e50', fontWeight: 600 }}>{formatCurrency(Math.round(avgOrder))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Refunds:</span>
                  <span style={{ color: '#2c3e50', fontWeight: 600 }}>{refundCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Export CSV Dialog ─────────────────────────────────────── */}
      <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileSpreadsheet className="size-5 text-green-400" /> Export Orders as CSV
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-4">
            <div className="bg-zinc-800 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between text-zinc-300">
                <span>Records to export</span>
                <span className="font-semibold text-white">{filtered.length}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Date filter</span>
                <span className="font-semibold text-white capitalize">{dateFilter === 'all' ? 'All time' : dateFilter}</span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Status filter</span>
                <span className="font-semibold text-white capitalize">{statusFilter === 'all' ? 'All statuses' : statusFilter}</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              The CSV will include Order ID, Date, Items, Amount, Status, Payment Method and Transaction ID columns.
            </p>
            <div className="flex gap-3">
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleExportCSV}>
                <Download className="size-4 mr-2" /> Download CSV
              </Button>
              <Button variant="outline" className="border-zinc-600 text-zinc-300 hover:bg-zinc-800" onClick={() => setCsvOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Download Invoices Dialog ─────────────────────────────── */}
      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileText className="size-5 text-blue-400" /> Download Invoices
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filtered.filter(o => o.status === 'completed').length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-sm flex flex-col items-center gap-2">
                  <AlertCircle className="size-8 text-zinc-600" />
                  No paid orders match the current filter.
                </div>
              ) : (
                filtered.filter(o => o.status === 'completed').map(order => (
                  <div key={order.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-white">{order.orderNumber ?? order.id}</p>
                      <p className="text-xs text-zinc-400">{formatDate(order.createdAt)} · {formatCurrency(order.totalAmount)}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-zinc-700" onClick={() => handleDownloadInvoice(order)}>
                      <Download className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            {filtered.filter(o => o.status === 'completed').length > 0 && (
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleDownloadAllInvoices}>
                <CheckCircle2 className="size-4 mr-2" /> Download All ({filtered.filter(o => o.status === 'completed').length}) Invoices
              </Button>
            )}
            <Button variant="outline" className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800" onClick={() => setInvoiceOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
