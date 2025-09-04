import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTransactionsByParty, getPartyById, createTransaction, getOpeningBalance } from '../services/apiService';

const PartyDetailsPage = () => {
  const { partyType, partyId } = useParams();
  const navigate = useNavigate();
  
  const [party, setParty] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txPage, setTxPage] = useState(1);
  const [txHasNext, setTxHasNext] = useState(false);
  const [serverOpeningBalance, setServerOpeningBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newDescription, setNewDescription] = useState('');
  const [newPurchaseSaleAmount, setNewPurchaseSaleAmount] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newMode, setNewMode] = useState('Cash');
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ visible: false, type: 'success', message: '' });
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [fullCurrentBalance, setFullCurrentBalance] = useState(0);

  useEffect(() => {
    fetchPartyAndTransactions();
  }, [partyId, partyType]);

  const fetchPartyAndTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch single party details efficiently
      const partyResponse = await getPartyById(partyType, partyId);
      const partyData = partyResponse?.data;
      if (!partyData) {
        setError('Party not found');
        return;
      }
      setParty(partyData);

      // Fetch newest 10 transactions (descending)
      const transactionsResponse = await getTransactionsByParty(partyId, {
        page: 1,
        limit: 10,
        sortOrder: 'desc',
      });
      const { items, hasNextPage, page } = transactionsResponse.data;
      setTransactions(items || []);
      setTxPage(page || 1);
      setTxHasNext(Boolean(hasNextPage));
      setTotalTransactions(Number(transactionsResponse.data?.total || items?.length || 0));
      setError(null);

      // Fetch opening balance separately using the dedicated API
      const partyModel = partyType === 'supplier' ? 'Supplier' : 'Customer';
      const openingBalanceResponse = await getOpeningBalance(partyId, partyModel, {
        page: 1,
        limit: 10,
        sortOrder: 'desc'
      });
      const { openingBalance, totalCurrentBalance } = openingBalanceResponse.data;
      setServerOpeningBalance(Number(openingBalance || 0));
      setFullCurrentBalance(Number(totalCurrentBalance || 0));
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTransactions = async () => {
    try {
      const nextPage = txPage + 1;
      const res = await getTransactionsByParty(partyId, {
        page: nextPage,
        limit: 10,
        sortOrder: 'desc',
      });
      const { items, hasNextPage } = res.data;
      setTransactions((prev) => [...prev, ...(items || [])]);
      setTxPage(nextPage);
      setTxHasNext(Boolean(hasNextPage));
      if (typeof res.data?.total === 'number') setTotalTransactions(res.data.total);

      // Refresh opening balance for the new page
      const partyModel = partyType === 'supplier' ? 'Supplier' : 'Customer';
      const openingBalanceResponse = await getOpeningBalance(partyId, partyModel, {
        page: nextPage,
        limit: 10,
        sortOrder: 'desc'
      });
      const { openingBalance, totalCurrentBalance } = openingBalanceResponse.data;
      setServerOpeningBalance(Number(openingBalance || 0));
      setFullCurrentBalance(Number(totalCurrentBalance || 0));
    } catch (e) {
      console.error('Failed to load more transactions', e);
      setToast({ visible: true, type: 'error', message: 'Failed to load more transactions.' });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
    }
  };

  const { filteredWithBalances, currentBalance, openingBalance } = useMemo(() => {
    // Build running balance map starting from serverOpeningBalance and iterating loaded items in true chronological order
    const chronologicalAll = [...transactions]
      .sort((a, b) => {
        const byDate = new Date(a.date) - new Date(b.date);
        if (byDate !== 0) return byDate;
        const byCreated = (a.createdAt ? new Date(a.createdAt) : 0) - (b.createdAt ? new Date(b.createdAt) : 0);
        if (byCreated !== 0) return byCreated;
        return (a._id || '').localeCompare(b._id || '');
      });

    let runningBalance = serverOpeningBalance || 0;
    const idToBalance = new Map();
    for (const transaction of chronologicalAll) {
      let balanceChange = 0;
      if (partyType === 'supplier') {
        if (transaction.type === 'Purchase') {
          balanceChange = transaction.amount;
        } else if (transaction.type === 'Payment Out') {
          balanceChange = -transaction.amount;
        } else {
          balanceChange = -transaction.amount;
        }
      } else {
        if (transaction.type === 'Sale') {
          balanceChange = transaction.amount;
        } else if (transaction.type === 'Payment In') {
          balanceChange = -transaction.amount;
        } else {
          balanceChange = -transaction.amount;
        }
      }
      runningBalance += balanceChange;
      idToBalance.set(transaction._id, runningBalance);
    }

    // Apply search filter AFTER computing full-history balances
    let filtered = transactions.filter(transaction =>
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.mode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.toString().includes(searchTerm)
    );

    // Sort for display according to current sort settings
    const displaySorted = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        const d = new Date(a.date) - new Date(b.date);
        if (d !== 0) return sortOrder === 'asc' ? d : -d;
        const c = (a.createdAt ? new Date(a.createdAt) : 0) - (b.createdAt ? new Date(b.createdAt) : 0);
        if (c !== 0) return sortOrder === 'asc' ? c : -c;
        const i = (a._id || '').localeCompare(b._id || '');
        return sortOrder === 'asc' ? i : -i;
      }
      let aValue, bValue;
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          aValue = new Date(a.date);
          bValue = new Date(b.date);
      }
      if (aValue === bValue) return 0;
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    const withBalances = displaySorted.map(t => ({ ...t, runningBalance: idToBalance.get(t._id) || 0 }));
    const opening = Number(serverOpeningBalance || 0);

    return {
      filteredWithBalances: withBalances,
      currentBalance: runningBalance,
      openingBalance: opening,
    };
  }, [transactions, searchTerm, sortBy, sortOrder, partyType, serverOpeningBalance]);

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'Purchase':
        return 'bg-blue-100 text-blue-800';
      case 'Sale':
        return 'bg-green-100 text-green-800';
      case 'Payment Out':
        return 'bg-red-100 text-red-800';
      case 'Payment In':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionCategory = (transaction) => {
    if (transaction.type === 'Purchase' || transaction.type === 'Sale') {
      return {
        category: transaction.type,
        color: transaction.type === 'Purchase' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
      };
    } else {
      return {
        category: transaction.type,
        color: transaction.type === 'Payment Out' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'
      };
    }
  };

  const getModeColor = (mode) => {
    switch (mode) {
      case 'Cash':
        return 'bg-yellow-100 text-yellow-800';
      case 'Bank':
        return 'bg-indigo-100 text-indigo-800';
      case 'Online Payment':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  

  const exportToCSV = () => {
    const csvEscape = (value) => {
      const str = String(value ?? '');
      const escaped = str.replace(/"/g, '""');
      return `"${escaped}"`;
    };
    const dynamicPurchaseSaleHeader = partyType === 'supplier' ? 'Purchase' : 'Sale';
    const dynamicPaymentHeader = partyType === 'supplier' ? 'Payment Out' : 'Payment In';
    const headers = ['Date', 'Description', dynamicPurchaseSaleHeader, dynamicPaymentHeader, 'Mode', 'Balance'];

    const rows = filteredWithBalances.map(t => {
      const datePart = new Date(t.date).toLocaleDateString();
      const timePart = t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const dateWithTime = timePart ? `${datePart} ${timePart}` : datePart;

      const isPurchaseSale = t.type === 'Purchase' || t.type === 'Sale';
      const isPayment = t.type === 'Payment Out' || t.type === 'Payment In';

      const purchaseSaleCol = isPurchaseSale ? `$${t.amount.toLocaleString()}` : '-';
      const paymentCol = isPayment ? `$${t.amount.toLocaleString()}` : '-';
      const modeCol = t.mode || '';
      const descriptionCol = t.description || '';
      const balanceCol = `$${(t.runningBalance || 0).toLocaleString()}`;

      return [dateWithTime, descriptionCol, purchaseSaleCol, paymentCol, modeCol, balanceCol]
        .map(csvEscape)
        .join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `party-${(party?.name || partyId)}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddTransaction = async () => {
    try {
      setSubmitError(null);
      setSubmitting(true);
      const hasPurchaseSale = newPurchaseSaleAmount !== '' && Number(newPurchaseSaleAmount) > 0;
      const hasPayment = newPaymentAmount !== '' && Number(newPaymentAmount) > 0;
      if (hasPurchaseSale && hasPayment) {
        throw new Error('Enter amount in only one column.');
      }
      if (!hasPurchaseSale && !hasPayment) {
        throw new Error('Enter a valid amount.');
      }
      if (!newDate) {
        throw new Error('Date is required.');
      }

      const amount = hasPurchaseSale ? Number(newPurchaseSaleAmount) : Number(newPaymentAmount);
      const partyModel = partyType === 'supplier' ? 'Supplier' : 'Customer';
      const type = hasPurchaseSale
        ? (partyType === 'supplier' ? 'Purchase' : 'Sale')
        : (partyType === 'supplier' ? 'Payment Out' : 'Payment In');

      await createTransaction({
        date: new Date(newDate),
        type,
        party: partyId,
        partyModel,
        mode: newMode,
        description: newDescription || undefined,
        amount,
      });

      // Refresh and clear form
      await fetchPartyAndTransactions();
      setNewDescription('');
      setNewPurchaseSaleAmount('');
      setNewPaymentAmount('');
      setNewMode('Cash');
      setToast({ visible: true, type: 'success', message: 'Transaction added successfully.' });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
    } catch (e) {
      setSubmitError(e.message || 'Failed to add transaction');
      setToast({ visible: true, type: 'error', message: e.message || 'Failed to add transaction.' });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchPartyAndTransactions}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mr-4"
        >
          Try Again
        </button>
        <button
          onClick={() => navigate('/parties')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Parties
        </button>
      </div>
    );
  }

  const filteredTransactions = filteredWithBalances;

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
            onClick={() => navigate('/parties')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{party?.name}</h1>
            <p className="text-gray-600 capitalize">{partyType} Details</p>
          </div>
        </div>

        {/* Party Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Contact Info</h3>
            <p className="mt-2 text-lg text-gray-900">{party?.contactInfo}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Current Balance</h3>
            <p className={`mt-2 text-lg font-semibold ${
              (Number(fullCurrentBalance) >= 0)
                ? (partyType === 'supplier' ? 'text-red-600' : 'text-green-600')
                : (partyType === 'supplier' ? 'text-green-600' : 'text-red-600')
            }`}>
              ${Number(fullCurrentBalance || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Transactions</h3>
            <p className="mt-2 text-lg text-gray-900">{totalTransactions}</p>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Export
          </button>
          
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
            <p className="mt-1 text-sm text-gray-500">
              No transactions found for this {partyType}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {partyType === 'supplier' ? 'Purchase' : 'Sale'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment {partyType === 'supplier' ? 'Out' : 'In'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Input Row */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 whitespace-nowrap">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={newPurchaseSaleAmount}
                      onChange={(e) => {
                        setNewPurchaseSaleAmount(e.target.value);
                        if (e.target.value) setNewPaymentAmount('');
                      }}
                      className="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={newPaymentAmount}
                      onChange={(e) => {
                        setNewPaymentAmount(e.target.value);
                        if (e.target.value) setNewPurchaseSaleAmount('');
                      }}
                      className="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <select
                      value={newMode}
                      onChange={(e) => setNewMode(e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Online Payment">Online Payment</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={handleAddTransaction}
                      disabled={submitting}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      {submitting ? 'Adding...' : 'Add'}
                    </button>
                  </td>
                </tr>
                {submitError && (
                  <tr>
                    <td colSpan={6} className="px-6 pb-2 text-sm text-red-600">
                      {submitError}
                    </td>
                  </tr>
                )}
                {filteredTransactions.length > 0 && (
                  <tr className="bg-white">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
                    <td className="px-6 py-4 text-sm text-gray-900">Opening Balance</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right"><span className="text-gray-400 text-xs">-</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right"><span className="text-gray-400 text-xs">-</span></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="text-gray-400 text-xs">-</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span className={`${
                        openingBalance >= 0
                          ? (partyType === 'supplier' ? 'text-red-600' : 'text-green-600')
                          : (partyType === 'supplier' ? 'text-green-600' : 'text-red-600')
                      }`}>
                        ${Number(openingBalance || 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                )}
                {filteredTransactions.map((transaction) => {
                  const category = getTransactionCategory(transaction);
                  const isPurchaseSale = transaction.type === 'Purchase' || transaction.type === 'Sale';
                  const isPayment = transaction.type === 'Payment Out' || transaction.type === 'Payment In';
                  
                  return (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.date).toLocaleDateString()} 
                        <span className="text-gray-500 ml-2">
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isPurchaseSale ? (
                          <span className="text-sm font-medium text-gray-900">
                            ${transaction.amount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isPayment ? (
                          <span className="text-sm font-medium text-gray-900">
                            ${transaction.amount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.mode && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getModeColor(transaction.mode)}`}>
                            {transaction.mode}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <span className={`${
                          transaction.runningBalance >= 0 
                            ? (partyType === 'supplier' ? 'text-red-600' : 'text-green-600')
                            : (partyType === 'supplier' ? 'text-green-600' : 'text-red-600')
                        }`}>
                          ${transaction.runningBalance.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
               </tbody>
            </table>
            {txHasNext && (
              <div className="p-4 border-t border-gray-200 flex justify-center">
                <button
                  onClick={loadMoreTransactions}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        )}
      </div>


    </div>
  );
};

export default PartyDetailsPage;
