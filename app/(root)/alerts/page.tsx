"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Bell, Check, Pencil, Trash2, ToggleLeft, ToggleRight, X } from "lucide-react";
import { toast } from "sonner";
import { StockSymbolSearch } from "@/components/StockSymbolSearch";

// Shape returned by our /api/alerts endpoints
type AlertItemDto = {
  _id: string;
  userId: string;
  symbol: string;
  operator: '>' | '<' | '>=' | '<=' | '==';
  threshold: number;
  active: boolean;
  note?: string;
  createdAt: string;
  lastTriggeredAt?: string;
};

export default function AlertsPage() {
  const [items, setItems] = useState<AlertItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // create form state
  const [symbol, setSymbol] = useState("");
  const [operator, setOperator] = useState<'>' | '<' | '>=' | '<=' | '=='>('>');
  const [threshold, setThreshold] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editThreshold, setEditThreshold] = useState<string>("");
  const [editOperator, setEditOperator] = useState<'>' | '<' | '>=' | '<=' | '=='>('>');
  const [editNote, setEditNote] = useState<string>("");

  const operators: Array<{ value: AlertItemDto["operator"]; label: string }> = useMemo(
    () => [
      { value: '>', label: '>' },
      { value: '<', label: '<' },
      { value: '>=', label: '>=' },
      { value: '<=', label: '<=' },
      { value: '==', label: '==' },
    ],
    []
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/alerts`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to load alerts' }));
        throw new Error(data.error || 'Failed to load alerts');
      }
      const data = await res.json();
      const list = (data?.data ?? []) as AlertItemDto[];
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      console.error(e);
      const errorMessage = e?.message || "Failed to load alerts";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createAlert() {
    const thr = Number((threshold || '').trim());
    if (!symbol.trim() || !isFinite(thr)) {
      const errorMessage = "Please provide a symbol and a valid threshold number.";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: any = { symbol: symbol.trim().toUpperCase(), operator, threshold: thr };
      if (note.trim()) payload.note = note.trim();
      const res = await fetch(`/api/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to create alert' }));
        throw new Error(data.error || 'Failed to create alert');
      }
      // Optimistically append
      await load();
      // clear form
      setSymbol("");
      setOperator('>');
      setThreshold("");
      setNote("");
      toast.success(`Alert created for ${payload.symbol}`);
    } catch (e: any) {
      console.error(e);
      const errorMessage = e?.message || "Failed to create alert";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, active: !active } : x)));
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to toggle alert' }));
        throw new Error(data.error || 'Failed to toggle alert');
      }
      toast.success(active ? 'Alert disabled' : 'Alert enabled');
    } catch (e: any) {
      console.error(e);
      const errorMessage = e?.message || 'Failed to toggle alert';
      toast.error(errorMessage);
      // revert on failure
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, active } : x)));
    }
  }

  function startEdit(item: AlertItemDto) {
    setEditingId(item._id);
    setEditThreshold(String(item.threshold));
    setEditOperator(item.operator);
    setEditNote(item.note || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditThreshold("");
    setEditOperator('>');
    setEditNote("");
  }

  async function saveEdit(id: string) {
    const thr = Number((editThreshold || '').trim());
    if (!isFinite(thr)) {
      const errorMessage = "Please provide a valid threshold number.";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold: thr, operator: editOperator, note: editNote.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to save alert' }));
        throw new Error(data.error || 'Failed to save alert');
      }
      // Update local state
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, threshold: thr, operator: editOperator, note: editNote.trim() || undefined } : x)));
      cancelEdit();
      toast.success('Alert updated successfully');
    } catch (e: any) {
      console.error(e);
      const errorMessage = e?.message || 'Failed to save alert';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }

  async function remove(id: string) {
    const prev = items;
    try {
      setItems((p) => p.filter((x) => x._id !== id));
      const res = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to delete alert' }));
        throw new Error(data.error || 'Failed to delete alert');
      }
      toast.success('Alert deleted successfully');
    } catch (e: any) {
      console.error(e);
      const errorMessage = e?.message || 'Failed to delete alert';
      toast.error(errorMessage);
      // revert
      setItems(prev);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2"><Bell className="h-6 w-6 text-emerald-500" /> Alerts</h1>
        <p className="text-gray-400 mt-2">Create and manage price alerts for your favorite stocks</p>
        <div className="mt-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <h2 className="text-sm font-semibold text-emerald-400 mb-2">How to use alerts:</h2>
          <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
            <li>Enter a stock symbol (e.g., AAPL, MSFT) or search using the dropdown</li>
            <li>Choose a comparison operator ({">"}, {"<"}, {"≥"}, {"≤"}, {"=="})</li>
            <li>Set a threshold price (e.g., 150.00)</li>
            <li>Optionally add a note to remember why you set this alert</li>
            <li>Click "Create Alert" to save</li>
            <li>Toggle alerts on/off using the switch button</li>
            <li>Edit alerts by clicking the pencil icon, or delete them with the trash icon</li>
          </ul>
        </div>
      </div>

      {/* Create form */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-1">
            <StockSymbolSearch value={symbol} onChange={setSymbol} placeholder="Search symbol..." />
          </div>
          <div className="md:col-span-1">
            <Select value={operator} onValueChange={(v) => setOperator(v as any)}>
              <SelectTrigger className="w-full"><SelectValue placeholder=">" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Operator</SelectLabel>
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Input placeholder="Threshold (e.g., 150.00)" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-red-400 h-5">{error}</div>
          <Button onClick={createAlert} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create Alert
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/40 overflow-hidden">
        <div className="px-4 py-3 text-sm text-gray-400 border-b border-gray-800">{loading ? 'Loading alerts...' : `Alerts (${items.length})`}</div>
        {loading ? (
          <div className="px-4 py-8 text-center text-gray-500">Fetching your alerts...</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">You have no alerts yet</div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {items.map((it) => (
              <li key={it._id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-gray-100">
                    <span className="font-semibold">{it.symbol}</span>
                    {editingId === it._id ? (
                      <>
                        <Select value={editOperator} onValueChange={(v) => setEditOperator(v as any)}>
                          <SelectTrigger className="h-7 px-2"><SelectValue placeholder=">" /></SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {operators.map((op) => (
                                <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <Input className="h-7 w-32" value={editThreshold} onChange={(e) => setEditThreshold(e.target.value)} />
                        <Input className="h-7 w-64" placeholder="Note" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
                      </>
                    ) : (
                      <>
                        <span className="text-gray-300">{it.operator}</span>
                        <span className="text-gray-100">{it.threshold}</span>
                        {it.note ? <span className="text-gray-500">• {it.note}</span> : null}
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created {new Date(it.createdAt).toLocaleString()} {it.lastTriggeredAt ? `• Last triggered ${new Date(it.lastTriggeredAt).toLocaleString()}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="text-gray-400 hover:text-emerald-400" onClick={() => toggleActive(it._id, it.active)} title={it.active ? 'Disable' : 'Enable'}>
                    {it.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  </Button>
                  {editingId === it._id ? (
                    <>
                      <Button variant="ghost" className="text-emerald-400 hover:text-emerald-300" onClick={() => saveEdit(it._id)} title="Save"><Check className="h-5 w-5" /></Button>
                      <Button variant="ghost" className="text-red-400 hover:text-red-300" onClick={cancelEdit} title="Cancel"><X className="h-5 w-5" /></Button>
                    </>
                  ) : (
                    <Button variant="ghost" className="text-gray-400 hover:text-gray-200" onClick={() => startEdit(it)} title="Edit"><Pencil className="h-5 w-5" /></Button>
                  )}
                  <Button variant="ghost" className="text-red-500 hover:text-red-400" onClick={() => remove(it._id)} title="Delete"><Trash2 className="h-5 w-5" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
