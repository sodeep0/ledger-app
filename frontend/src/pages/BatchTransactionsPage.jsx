import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSuppliers, getCustomers, createTransaction } from '../services/apiService';

const emptyRow = (defaultDate) => ({
  date: defaultDate,
  partyId: '',
  partyName: '',
  type: '',
  amount: '',
  mode: 'Cash',
  description: '',
  partyDropdownOpen: false,
  partyHighlightedIndex: 0,
});

const BatchTransactionsPage = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rows, setRows] = useState(() => [emptyRow(new Date().toISOString().slice(0, 10))]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, type: 'success', message: '' });
  const [globalPartyModel, setGlobalPartyModel] = useState('Supplier');
  const [anyDropdownOpen, setAnyDropdownOpen] = useState(false);
  const partyRowRefs = useRef([]);

  useEffect(() => {
    const loadParties = async () => {
      try {
        const [s, c] = await Promise.all([getSuppliers(), getCustomers()]);
        setSuppliers(s.data);
        setCustomers(c.data);
      } catch (e) {
        setToast({ visible: true, type: 'error', message: 'Failed to load parties.' });
        setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
      }
    };
    loadParties();
  }, []);

  const allParties = useMemo(() => ([
    ...suppliers.map(s => ({ _id: s._id, name: s.name, type: 'Supplier' })),
    ...customers.map(c => ({ _id: c._id, name: c.name, type: 'Customer' })),
  ]), [suppliers, customers]);
  const filteredParties = useMemo(() => allParties.filter(p => p.type === globalPartyModel), [allParties, globalPartyModel]);

  const updateRow = (index, updates) => {
    setRows(prev => {
      const next = prev.map((r, i) => i === index ? { ...r, ...updates } : r);
      setAnyDropdownOpen(next.some(r => r.partyDropdownOpen));
      return next;
    });
  };

  const openPartyDropdown = (index) => {
    setRows(prev => {
      const next = prev.map((r, i) => ({
        ...r,
        partyDropdownOpen: i === index,
        partyHighlightedIndex: i === index ? (r.partyHighlightedIndex || 0) : 0,
      }));
    setAnyDropdownOpen(true);
      return next;
    });
  };

  const closeAllDropdowns = () => {
    setRows(prev => {
      const next = prev.map((r) => ({ ...r, partyDropdownOpen: false }));
      setAnyDropdownOpen(false);
      return next;
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleGlobalMouseDown = (e) => {
      if (!anyDropdownOpen) return;
      const isInsideSomeRow = partyRowRefs.current.some((el) => el && el.contains(e.target));
      if (!isInsideSomeRow) {
        closeAllDropdowns();
      }
    };
    document.addEventListener('mousedown', handleGlobalMouseDown);
    return () => document.removeEventListener('mousedown', handleGlobalMouseDown);
  }, [anyDropdownOpen]);

  const addRow = () => {
    setRows(prev => [...prev, emptyRow(prev[prev.length - 1]?.date || new Date().toISOString().slice(0, 10))]);
  };

  const removeRow = (index) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const getRowFilteredOptions = (row) => {
    const query = (row.partyName || '').toLowerCase();
    const options = filteredParties.filter(p => p.name.toLowerCase().includes(query)).slice(0, 20);
    return options;
  };

  const selectPartyForRow = (idx, party) => {
    updateRow(idx, { partyId: party._id, partyName: party.name, partyDropdownOpen: false });
  };

  const handlePartyInputKeyDown = (e, idx, row) => {
    const options = getRowFilteredOptions(row);
    const max = Math.max(options.length - 1, 0);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      openPartyDropdown(idx);
      updateRow(idx, {
        partyHighlightedIndex: Math.min(row.partyHighlightedIndex + 1, max)
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openPartyDropdown(idx);
      updateRow(idx, {
        partyHighlightedIndex: Math.max(row.partyHighlightedIndex - 1, 0)
      });
    } else if (e.key === 'Enter') {
      if (row.partyDropdownOpen && options.length > 0) {
        e.preventDefault();
        const chosen = options[Math.min(row.partyHighlightedIndex, options.length - 1)];
        if (chosen) selectPartyForRow(idx, chosen);
      }
    } else if (e.key === 'Escape') {
      closeAllDropdowns();
    }
  };

  const validateRow = (r) => {
    if (!r.date) return 'Date required';
    if (!r.partyId) return 'Party required';
    if (!r.type) return 'Type required';
    const amt = Number(r.amount);
    if (!(amt > 0)) return 'Amount must be > 0';
    return null;
  };

  const handleSubmit = async () => {
    const errors = rows.map(validateRow);
    const firstErrorIndex = errors.findIndex(e => e);
    if (firstErrorIndex !== -1) {
      setToast({ visible: true, type: 'error', message: `Row ${firstErrorIndex + 1}: ${errors[firstErrorIndex]}` });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
      return;
    }

    setSubmitting(true);
    try {
      // Sequential submission to ensure balances are updated consistently.
      for (const r of rows) {
        await createTransaction({
          date: new Date(r.date),
          type: r.type,
          party: r.partyId,
          partyModel: globalPartyModel,
          mode: r.mode,
          description: r.description || undefined,
          amount: Number(r.amount),
        });
      }
      setToast({ visible: true, type: 'success', message: 'All transactions added successfully.' });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
      setRows([emptyRow(new Date().toISOString().slice(0, 10))]);
    } catch (e) {
      setToast({ visible: true, type: 'error', message: e.message || 'Failed to add batch.' });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow text-sm ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/transactions')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Batch Transactions</h1>
            <p className="text-gray-600">Add multiple transactions at once</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Party Type:</span>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => {
                setGlobalPartyModel('Supplier');
                // Clear party selections and types to avoid invalid combinations
                setRows(prev => prev.map(r => ({ ...r, partyId: '', partyName: '', type: '' })));
              }}
              className={`px-3 py-1.5 text-sm border ${globalPartyModel === 'Supplier' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Supplier
            </button>
            <button
              type="button"
              onClick={() => {
                setGlobalPartyModel('Customer');
                setRows(prev => prev.map(r => ({ ...r, partyId: '', partyName: '', type: '' })));
              }}
              className={`px-3 py-1.5 text-sm border -ml-px ${globalPartyModel === 'Customer' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Customer
            </button>
          </div>
        </div>
      </div>

      <div className={`bg-white shadow rounded-lg ${anyDropdownOpen ? 'overflow-visible' : 'overflow-hidden'}`}>
        <div className={`relative ${anyDropdownOpen ? 'overflow-visible' : 'overflow-x-auto'}`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-2">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(idx, { date: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                  </td>
                  <td className="px-6 py-2">
                    <div className="relative" ref={(el) => { partyRowRefs.current[idx] = el; }}>
                      <div className="flex items-center">
                        <input
                          type="text"
                          placeholder={`Search ${globalPartyModel.toLowerCase()} by name`}
                          value={row.partyName}
                          onChange={(e) => { updateRow(idx, { partyName: e.target.value, partyId: '', partyHighlightedIndex: 0 }); openPartyDropdown(idx); }}
                          onFocus={() => openPartyDropdown(idx)}
                          onKeyDown={(e) => handlePartyInputKeyDown(e, idx, row)}
                          className={`flex-1 border rounded-l-md px-2 py-1 text-sm min-w-[12rem] focus:outline-none focus:ring-1 focus:ring-red-500 ${row.partyId ? 'border-gray-300' : (row.partyName ? 'border-red-500' : 'border-gray-300')}`}
                        />
                        <button
                          type="button"
                          onClick={() => (row.partyDropdownOpen ? closeAllDropdowns() : openPartyDropdown(idx))}
                          className="px-2 py-1 border border-l-0 border-gray-300 rounded-r-md text-sm bg-white hover:bg-gray-50"
                        >
                          <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      {row.partyDropdownOpen && (
                        <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow max-h-64 overflow-auto">
                          {getRowFilteredOptions(row).length === 0 ? (
                            <li className="px-3 py-2 text-sm text-gray-500">No matches</li>
                          ) : (
                            getRowFilteredOptions(row).map((p, optIdx) => (
                              <li
                                key={`${p.type}-${p._id}`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => selectPartyForRow(idx, p)}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${row.partyHighlightedIndex === optIdx ? 'bg-gray-100' : ''}`}
                              >
                                {p.name}
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-2">
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={row.description}
                      onChange={(e) => updateRow(idx, { description: e.target.value })}
                      className="w-full min-w-[9rem] border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-6 py-2">
                    <select
                      value={row.type}
                      onChange={(e) => updateRow(idx, { type: e.target.value })}
                      className="w-full min-w-[7rem] border border-gray-300 rounded-md px-2 py-1 text-sm"
                    >
                      {globalPartyModel === 'Supplier' ? (
                        <>
                          <option value="">Select type</option>
                          <option value="Purchase">Purchase</option>
                          <option value="Payment Out">Payment Out</option>
                        </>
                      ) : (
                        <>
                          <option value="">Select type</option>
                          <option value="Sale">Sale</option>
                          <option value="Payment In">Payment In</option>
                        </>
                      )}
                    </select>
                  </td>
                  <td className="px-6 py-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={row.amount}
                      onChange={(e) => updateRow(idx, { amount: e.target.value })}
                      className="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                  </td>
                  <td className="px-6 py-2">
                    <select
                      value={row.mode}
                      onChange={(e) => updateRow(idx, { mode: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Online Payment">Online Payment</option>
                    </select>
                  </td>
                  <td className="px-6 py-2 text-right">
                    <button
                      onClick={() => removeRow(idx)}
                      className="text-gray-600 hover:text-gray-900 text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={7} className="px-6 py-3">
                  <div className="flex justify-between">
                    <button
                      onClick={addRow}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
                    >
                      + Add Row
                    </button>
                    <div className="space-x-3">
                      <button
                        onClick={() => navigate('/transactions')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        {submitting ? 'Saving...' : 'Save All'}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BatchTransactionsPage;


