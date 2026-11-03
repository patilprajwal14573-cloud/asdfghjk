import { useMemo, useRef, useState } from 'react';
import { useStore } from '@/utils/store';
import {
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  FileWarning,
} from 'lucide-react';
import {
  CATEGORIES,
  Category,
  Transaction,
} from '@/utils/types';
import { formatINR, formatDate } from '@/utils/format';
import CategoryBadge from '@/components/CategoryBadge';
import ConfidenceBar from '@/components/ConfidenceBar';
import EmptyState from '@/components/EmptyState';
import { Receipt } from 'lucide-react';
import {
  parseCSV,
  transactionsToCSV,
  parsedRowsToTransactions,
  downloadCSV,
  validateFile,
} from '@/utils/csv';

type SortKey = 'date' | 'amount' | 'description';
type SortDir = 'asc' | 'desc';

export default function Transactions() {
  const {
    state,
    classifier,
    addTransaction,
    updateTransactionCategory,
    deleteTransaction,
    importTransactions,
  } = useStore();

  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [livePrediction, setLivePrediction] = useState<{
    category: Category;
    confidence: number;
    alternatives: { category: Category; probability: number }[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = state.transactions;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortKey === 'amount') cmp = a.amount - b.amount;
      else cmp = a.description.localeCompare(b.description);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [state.transactions, search, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function handleFile(file: File | null) {
    setCsvError(null);
    setCsvSuccess(null);
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setCsvError(err);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const { rows, errors } = parseCSV(text);
      if (rows.length === 0) {
        setCsvError(
          errors.length > 0
            ? `No valid rows found. ${errors.slice(0, 3).join(' ')}`
            : 'The file has no valid rows. Columns must be date, description, amount, type.',
        );
        return;
      }
      const txns = parsedRowsToTransactions(rows, classifier);
      importTransactions(txns);
      setCsvSuccess(
        `Imported ${txns.length} transaction${txns.length === 1 ? '' : 's'}${
          errors.length > 0 ? `. ${errors.length} row(s) skipped.` : ''
        }.`,
      );
      if (errors.length > 0 && rows.length === 0) {
        // handled above
      }
    };
    reader.onerror = () => setCsvError('Could not read the file. Try again.');
    reader.readAsText(file);
  }

  function handleDownload() {
    if (state.transactions.length === 0) return;
    const csv = transactionsToCSV(state.transactions);
    downloadCSV('finwise-transactions.csv', csv);
  }

  if (state.transactions.length === 0 && !showAdd) {
    return (
      <div className="space-y-4">
        <PageHeader />
        <EmptyState
          icon={<Receipt className="h-8 w-8" />}
          title="No transactions yet"
          message="Add your first transaction, or load a sample persona from the header to explore."
          action={
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Add transaction
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description or category"
            className="input pl-9"
          />
        </div>
        <button onClick={() => setShowAdd((s) => !s)} className="btn-primary">
          <Plus className="h-4 w-4" /> Add
        </button>
        <button onClick={() => fileRef.current?.click()} className="btn-secondary">
          <Upload className="h-4 w-4" /> Import CSV
        </button>
        <button
          onClick={handleDownload}
          className="btn-secondary"
          disabled={state.transactions.length === 0}
        >
          <Download className="h-4 w-4" /> Export
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {csvError && (
        <div className="flex items-start gap-2 rounded-lg border border-wants-200 bg-wants-50 px-3 py-2 text-sm text-wants-700 dark:border-wants-800 dark:bg-wants-900/30 dark:text-wants-300">
          <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{csvError}</span>
        </div>
      )}
      {csvSuccess && (
        <div className="flex items-start gap-2 rounded-lg border border-savings-200 bg-savings-50 px-3 py-2 text-sm text-savings-700 dark:border-savings-800 dark:bg-savings-900/30 dark:text-savings-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{csvSuccess}</span>
        </div>
      )}

      {showAdd && (
        <AddTransactionForm
          classifier={classifier}
          livePrediction={livePrediction}
          setLivePrediction={setLivePrediction}
          onSubmit={(t) => {
            addTransaction(t);
            setShowAdd(false);
            setLivePrediction(null);
          }}
          onCancel={() => {
            setShowAdd(false);
            setLivePrediction(null);
          }}
        />
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-500 dark:bg-brand-800/50 dark:text-brand-400">
              <tr>
                <SortableTh label="Date" k="date" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortableTh label="Description" k="description" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <SortableTh label="Amount" k="amount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-brand-400">
                    No transactions match your search.
                  </td>
                </tr>
              )}
              {filtered.map((t) => (
                <TransactionRow
                  key={t.id}
                  txn={t}
                  onCorrect={(c) => updateTransactionCategory(t.id, c)}
                  onDelete={() => deleteTransaction(t.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-brand-400">
        {filtered.length} of {state.transactions.length} transactions shown.
      </p>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-800 dark:text-white">
        Transactions
      </h1>
      <p className="mt-1 text-sm text-brand-500">
        Search, sort, edit categories, and import or export CSV files.
      </p>
    </div>
  );
}

function SortableTh({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <th className="px-4 py-3 font-medium">
      <button
        onClick={() => onSort(k)}
        className="inline-flex items-center gap-1 hover:text-brand-700 dark:hover:text-brand-200"
      >
        {label}
        {active &&
          (sortDir === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          ))}
      </button>
    </th>
  );
}

function TransactionRow({
  txn,
  onCorrect,
  onDelete,
}: {
  txn: Transaction;
  onCorrect: (c: Category) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <tr className="border-b transition hover:bg-brand-50 dark:border-brand-800 dark:hover:bg-brand-800/40">
      <td className="px-4 py-3 whitespace-nowrap text-brand-600 dark:text-brand-300">
        {formatDate(txn.date)}
      </td>
      <td className="px-4 py-3">
        <span className="text-brand-800 dark:text-brand-100">
          {txn.description}
        </span>
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <select
            autoFocus
            value={txn.category}
            onChange={(e) => {
              onCorrect(e.target.value as Category);
              setEditing(false);
            }}
            onBlur={() => setEditing(false)}
            className="input w-auto py-1 text-xs"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : (
          <button
            onClick={() => setEditing(true)}
            title="Click to correct category"
            className="transition hover:opacity-80"
          >
            <CategoryBadge category={txn.category} corrected={txn.corrected} />
          </button>
        )}
      </td>
      <td className="px-4 py-3">
        <ConfidenceBar confidence={txn.confidence} />
      </td>
      <td
        className={`px-4 py-3 whitespace-nowrap font-medium tabular-nums ${
          txn.type === 'income'
            ? 'text-savings-600 dark:text-savings-400'
            : 'text-wants-600 dark:text-wants-400'
        }`}
      >
        {txn.type === 'income' ? '+' : '−'}
        {formatINR(txn.amount)}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={onDelete}
          className="btn-ghost p-1.5 text-wants-500 hover:text-wants-600"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function AddTransactionForm({
  classifier,
  livePrediction,
  setLivePrediction,
  onSubmit,
  onCancel,
}: {
  classifier: ReturnType<typeof useStore>['classifier'];
  livePrediction: {
    category: Category;
    confidence: number;
    alternatives: { category: Category; probability: number }[];
  } | null;
  setLivePrediction: (p: AddTransactionFormProps['livePrediction']) => void;
  onSubmit: (t: {
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
  }) => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  function onDescChange(v: string) {
    setDescription(v);
    if (v.trim().length > 2) {
      const pred = classifier.predict(v);
      setLivePrediction({
        category: pred.category,
        confidence: pred.confidence,
        alternatives: pred.alternatives,
      });
    } else {
      setLivePrediction(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!description.trim() || !isFinite(amt) || amt <= 0) return;
    onSubmit({ date, description: description.trim(), amount: amt, type });
  }

  return (
    <form onSubmit={handleSubmit} className="card animate-scale-in p-4">
      <h2 className="text-base font-semibold text-brand-800 dark:text-brand-100">
        Add transaction
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-brand-500">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-brand-500">
            Description
          </label>
          <input
            value={description}
            onChange={(e) => onDescChange(e.target.value)}
            placeholder="e.g. UPI SWIGGY BANGALORE"
            className="input"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-brand-500">
            Amount (₹)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            className="input"
            required
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-300">
            <input
              type="radio"
              name="type"
              value="expense"
              checked={type === 'expense'}
              onChange={() => setType('expense')}
              className="accent-wants-500"
            />
            Expense
          </label>
          <label className="flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-300">
            <input
              type="radio"
              name="type"
              value="income"
              checked={type === 'income'}
              onChange={() => setType('income')}
              className="accent-savings-500"
            />
            Income
          </label>
        </div>
        {livePrediction && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-brand-500">Predicted:</span>
            <CategoryBadge category={livePrediction.category} />
            <ConfidenceBar confidence={livePrediction.confidence} />
          </div>
        )}
      </div>
      {livePrediction && livePrediction.alternatives.length > 0 && (
        <p className="mt-2 text-xs text-brand-400">
          Alternatives:{' '}
          {livePrediction.alternatives
            .map(
              (a) =>
                `${a.category} (${(a.probability * 100).toFixed(0)}%)`,
            )
            .join(', ')}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save transaction
        </button>
      </div>
    </form>
  );
}

// Re-exported type alias so props typing stays clean.
type AddTransactionFormProps = Parameters<typeof AddTransactionForm>[0];
