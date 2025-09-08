import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTransactionsByParty, getPartyById, createTransaction, getOpeningBalance } from '../services/apiService';

// Validation utilities
const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

const isValidNumericAmount = (value) => {
  if (value === '' || value === null || value === undefined) return false;
  const num = Number(value);
  return !isNaN(num) && num >= 0 && isFinite(num);
};

const sanitizeCSVValue = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape CSV injection characters
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    return `'${str}`;
  }
  return str.replace(/"/g, '""');
};

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
  const [loadMoreError, setLoadMoreError] = useState(null);
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
      setError(null);
      setLoadMoreError(null);
      
      // Fetch single party details efficiently with validation
      const partyResponse = await getPartyById(partyType, partyId);
      if (!partyResponse?.data || typeof partyResponse.data !== 'object') {
        setError('Invalid party data received from server');
        return;
      }
      
      const partyData = partyResponse.data;
      if (!partyData.name || typeof partyData.name !== 'string') {
        setError('Party name is missing or invalid');
        return;
      }
      
      setParty(partyData);

      // Fetch newest 10 transactions (descending) with validation
      const transactionsResponse = await getTransactionsByParty(partyId, {
        page: 1,
        limit: 10,
        sortOrder: 'desc',
      });
      
      if (!transactionsResponse?.data || typeof transactionsResponse.data !== 'object') {
        setError('Invalid transactions data received from server');
        return;
      }
      
      const { items, hasNextPage, page, total } = transactionsResponse.data;
      
      // Validate items is an array
      if (!Array.isArray(items)) {
        setError('Transactions data is not in expected format');
        return;
      }
      
      setTransactions(items);
      setTxPage(Number(page) || 1);
      setTxHasNext(Boolean(hasNextPage));
      setTotalTransactions(Number(total) || items.length);

      // Fetch opening balance separately using the dedicated API with validation
      const partyModel = partyType === 'supplier' ? 'Supplier' : 'Customer';
      const openingBalanceResponse = await getOpeningBalance(partyId, partyModel, {
        page: 1,
        limit: 10,
        sortOrder: 'desc'
      });
      
      if (!openingBalanceResponse?.data || typeof openingBalanceResponse.data !== 'object') {
        setError('Invalid opening balance data received from server');
        return;
      }
      
      const { openingBalance, totalCurrentBalance } = openingBalanceResponse.data;
      
      // Validate numeric values
      const validOpeningBalance = Number(openingBalance);
      const validTotalBalance = Number(totalCurrentBalance);
      
      if (isNaN(validOpeningBalance) || isNaN(validTotalBalance)) {
        setError('Invalid balance values received from server');
        return;
      }
      
      setServerOpeningBalance(validOpeningBalance);
      setFullCurrentBalance(validTotalBalance);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch data. Please try again later.';
      setError(errorMessage);
      console.error('Error fetching party and transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTransactions = async () => {
    try {
      setLoadMoreError(null);
      const nextPage = txPage + 1;
      
      const res = await getTransactionsByParty(partyId, {
        page: nextPage,
        limit: 10,
        sortOrder: 'desc',
      });
      
      // Validate response structure
      if (!res?.data || typeof res.data !== 'object') {
        throw new Error('Invalid response structure from server');
      }
      
      const { items, hasNextPage, total } = res.data;
      
      // Validate items is an array
      if (!Array.isArray(items)) {
        throw new Error('Invalid transactions data format');
      }
      
      setTransactions((prev) => [...prev, ...items]);
      setTxPage(nextPage);
      setTxHasNext(Boolean(hasNextPage));
      
      if (typeof total === 'number') {
        setTotalTransactions(total);
      }

      // Refresh opening balance for the new page with validation
      const partyModel = partyType === 'supplier' ? 'Supplier' : 'Customer';
      const openingBalanceResponse = await getOpeningBalance(partyId, partyModel, {
        page: nextPage,
        limit: 10,
        sortOrder: 'desc'
      });
      
      if (!openingBalanceResponse?.data || typeof openingBalanceResponse.data !== 'object') {
        throw new Error('Invalid opening balance response');
      }
      
      const { openingBalance, totalCurrentBalance } = openingBalanceResponse.data;
      
      // Validate numeric values
      const validOpeningBalance = Number(openingBalance);
      const validTotalBalance = Number(totalCurrentBalance);
      
      if (isNaN(validOpeningBalance) || isNaN(validTotalBalance)) {
        throw new Error('Invalid balance values in response');
      }
      
      setServerOpeningBalance(validOpeningBalance);
      setFullCurrentBalance(validTotalBalance);
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || 'Failed to load more transactions';
      setLoadMoreError(errorMessage);
      console.error('Failed to load more transactions:', e);
      setToast({ visible: true, type: 'error', message: errorMessage });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000);
    }
  };

  const { filteredWithBalances, currentBalance, openingBalance } = useMemo(() => {
    // Build running balance map starting from serverOpeningBalance and iterating loaded items in true chronological order
    const chronologicalAll = [...transactions]
      .filter(transaction => {
        // Filter out transactions with invalid dates
        return isValidDate(transaction.date);
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const byDate = dateA.getTime() - dateB.getTime();
        if (byDate !== 0) return byDate;
        
        const createdA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const createdB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        const byCreated = createdA.getTime() - createdB.getTime();
        if (byCreated !== 0) return byCreated;
        
        return (a._id || '').localeCompare(b._id || '');
      });

    let runningBalance = Number(serverOpeningBalance) || 0;
    const idToBalance = new Map();
    
    for (const transaction of chronologicalAll) {
      // Ensure amount is numeric and valid
      const amount = Number(transaction.amount) || 0;
      if (isNaN(amount) || !isFinite(amount)) {
        console.warn('Invalid transaction amount:', transaction.amount, 'for transaction:', transaction._id);
        continue;
      }
      
      let balanceChange = 0;
      if (partyType === 'supplier') {
        if (transaction.type === 'Purchase') {
          balanceChange = amount;
        } else if (transaction.type === 'Payment Out') {
          balanceChange = -amount;
        } else {
          balanceChange = -amount;
        }
      } else {
        if (transaction.type === 'Sale') {
          balanceChange = amount;
        } else if (transaction.type === 'Payment In') {
          balanceChange = -amount;
        } else {
          balanceChange = -amount;
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
      (transaction.amount && transaction.amount.toString().includes(searchTerm))
    );

    // Sort for display according to current sort settings
    const displaySorted = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const d = dateA.getTime() - dateB.getTime();
        if (d !== 0) return sortOrder === 'asc' ? d : -d;
        
        const createdA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const createdB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        const c = createdA.getTime() - createdB.getTime();
        if (c !== 0) return sortOrder === 'asc' ? c : -c;
        
        const i = (a._id || '').localeCompare(b._id || '');
        return sortOrder === 'asc' ? i : -i;
      }
      let aValue, bValue;
      switch (sortBy) {
        case 'amount':
          aValue = Number(a.amount) || 0;
          bValue = Number(b.amount) || 0;
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }
      if (aValue === bValue) return 0;
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    const withBalances = displaySorted.map(t => ({ 
      ...t, 
      runningBalance: idToBalance.get(t._id) || 0 
    }));
    const opening = Number(serverOpeningBalance) || 0;

    return {
      filteredWithBalances: withBalances,
      currentBalance: runningBalance,
      openingBalance: opening,
    };
  }, [transactions, searchTerm, sortBy, sortOrder, serverOpeningBalance]);

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

  

  const exportToCSV = useCallback(() => {
    const csvEscape = (value) => {
      const sanitized = sanitizeCSVValue(value);
      const escaped = sanitized.replace(/"/g, '""');
      return `"${escaped}"`;
    };
    
    const dynamicPurchaseSaleHeader = partyType === 'supplier' ? 'Purchase' : 'Sale';
    const dynamicPaymentHeader = partyType === 'supplier' ? 'Payment Out' : 'Payment In';
    const headers = ['Date', 'Description', dynamicPurchaseSaleHeader, dynamicPaymentHeader, 'Mode', 'Balance'];

    const rows = filteredWithBalances.map(t => {
      // Validate date before processing
      if (!isValidDate(t.date)) {
        console.warn('Invalid date in transaction:', t._id);
        return null;
      }
      
      const datePart = new Date(t.date).toLocaleDateString();
      const timePart = t.createdAt && isValidDate(t.createdAt) 
        ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : '';
      const dateWithTime = timePart ? `${datePart} ${timePart}` : datePart;

      const isPurchaseSale = t.type === 'Purchase' || t.type === 'Sale';
      const isPayment = t.type === 'Payment Out' || t.type === 'Payment In';

      // Ensure amounts are numeric
      const amount = Number(t.amount) || 0;
      const balance = Number(t.runningBalance) || 0;

      const purchaseSaleCol = isPurchaseSale ? `$${amount.toLocaleString()}` : '-';
      const paymentCol = isPayment ? `$${amount.toLocaleString()}` : '-';
      const modeCol = sanitizeCSVValue(t.mode || '');
      const descriptionCol = sanitizeCSVValue(t.description || '');
      const balanceCol = `$${balance.toLocaleString()}`;

      return [dateWithTime, descriptionCol, purchaseSaleCol, paymentCol, modeCol, balanceCol]
        .map(csvEscape)
        .join(',');
    }).filter(row => row !== null); // Remove null rows from invalid dates

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    // Sanitize filename to prevent path traversal
    const safePartyName = sanitizeCSVValue(party?.name || partyId).replace(/[^a-zA-Z0-9-_]/g, '_');
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `party-${safePartyName}-${today}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up the URL object
  }, [filteredWithBalances, partyType, party?.name, partyId]);

  const handleAddTransaction = async () => {
    try {
      setSubmitError(null);
      setSubmitting(true);
      
      // Validate date
      if (!newDate || !isValidDate(newDate)) {
        throw new Error('Please enter a valid date.');
      }
      
      // Validate amounts
      const purchaseSaleAmount = newPurchaseSaleAmount.trim();
      const paymentAmount = newPaymentAmount.trim();
      
      const hasPurchaseSale = purchaseSaleAmount !== '' && isValidNumericAmount(purchaseSaleAmount);
      const hasPayment = paymentAmount !== '' && isValidNumericAmount(paymentAmount);
      
      if (hasPurchaseSale && hasPayment) {
        throw new Error('Enter amount in only one column.');
      }
      if (!hasPurchaseSale && !hasPayment) {
        throw new Error('Please enter a valid amount greater than 0.');
      }
      
      // Validate amount values
      const purchaseSaleNum = hasPurchaseSale ? Number(purchaseSaleAmount) : 0;
      const paymentNum = hasPayment ? Number(paymentAmount) : 0;
      
      if (hasPurchaseSale && (purchaseSaleNum <= 0 || !isFinite(purchaseSaleNum))) {
        throw new Error('Purchase/Sale amount must be a positive number.');
      }
      if (hasPayment && (paymentNum <= 0 || !isFinite(paymentNum))) {
        throw new Error('Payment amount must be a positive number.');
      }

      const amount = hasPurchaseSale ? purchaseSaleNum : paymentNum;
      const partyModel = partyType === 'supplier' ? 'Supplier' : 'Customer';
      const type = hasPurchaseSale
        ? (partyType === 'supplier' ? 'Purchase' : 'Sale')
        : (partyType === 'supplier' ? 'Payment Out' : 'Payment In');

      // Validate partyId
      if (!partyId || typeof partyId !== 'string') {
        throw new Error('Invalid party ID.');
      }

      await createTransaction({
        date: new Date(newDate),
        type,
        party: partyId,
        partyModel,
        mode: newMode,
        description: newDescription.trim() || undefined,
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
      const errorMessage = e.response?.data?.message || e.message || 'Failed to add transaction';
      setSubmitError(errorMessage);
      setToast({ visible: true, type: 'error', message: errorMessage });
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
    <div className="w-full max-w-full overflow-hidden">
      {/* Toast */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow text-sm ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center mb-3 sm:mb-4">
          <button
            onClick={() => navigate('/parties')}
            className="mr-3 sm:mr-4 p-1.5 sm:p-2 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{party?.name}</h1>
            <p className="text-sm sm:text-base text-gray-600 capitalize">{partyType} Details</p>
          </div>
        </div>

        {/* Party Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Contact Info</h3>
            <p className="mt-2 text-base sm:text-lg text-gray-900 break-words">{party?.contactInfo}</p>
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Current Balance</h3>
            <p className={`mt-2 text-base sm:text-lg font-semibold ${
              (Number(fullCurrentBalance) >= 0)
                ? (partyType === 'supplier' ? 'text-red-600' : 'text-green-600')
                : (partyType === 'supplier' ? 'text-green-600' : 'text-red-600')
            }`}>
              ${Number(fullCurrentBalance || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Total Transactions</h3>
            <p className="mt-2 text-base sm:text-lg text-gray-900">{totalTransactions}</p>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm"
            />
          </div>
        </div>
        
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Export
          </button>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              No transactions found for this {partyType}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Description
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {partyType === 'supplier' ? 'Purchase' : 'Sale'}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment {partyType === 'supplier' ? 'Out' : 'In'}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Mode
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Input Row */}
                <tr className="bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                  </td>
                  <td className="px-3 sm:px-6 py-3 hidden sm:table-cell">
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right">
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
                      className="w-24 sm:w-32 border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right">
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
                      className="w-24 sm:w-32 border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm text-right focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    />
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap hidden md:table-cell">
                    <select
                      value={newMode}
                      onChange={(e) => setNewMode(e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Online Payment">Online Payment</option>
                    </select>
                  </td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={handleAddTransaction}
                      disabled={submitting}
                      className="inline-flex items-center px-2 sm:px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      {submitting ? 'Adding...' : 'Add'}
                    </button>
                  </td>
                </tr>
                {submitError && (
                  <tr>
                    <td colSpan={6} className="px-3 sm:px-6 pb-2 text-xs sm:text-sm text-red-600">
                      {submitError}
                    </td>
                  </tr>
                )}
                {filteredTransactions.length > 0 && (
                  <tr className="bg-white">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">-</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 hidden sm:table-cell">Opening Balance</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right"><span className="text-gray-400 text-xs">-</span></td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right"><span className="text-gray-400 text-xs">-</span></td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell"><span className="text-gray-400 text-xs">-</span></td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
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
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span>{new Date(transaction.date).toLocaleDateString()}</span>
                          {transaction.createdAt && (
                            <span className="text-gray-500 text-xs">
                              {new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                        <div className="truncate max-w-32 sm:max-w-none">
                          {transaction.description || '-'}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                        {isPurchaseSale ? (
                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                            ${transaction.amount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                        {isPayment ? (
                          <span className="text-xs sm:text-sm font-medium text-gray-900">
                            ${transaction.amount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                        {transaction.mode && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getModeColor(transaction.mode)}`}>
                            {transaction.mode}
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
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
              <div className="p-3 sm:p-4 border-t border-gray-200">
                {loadMoreError && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs sm:text-sm text-red-600">
                    {loadMoreError}
                  </div>
                )}
                <div className="flex justify-center">
                  <button
                    onClick={loadMoreTransactions}
                    className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-md text-xs sm:text-sm hover:bg-gray-50"
                  >
                    Load more
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>


    </div>
  );
};

export default PartyDetailsPage;
