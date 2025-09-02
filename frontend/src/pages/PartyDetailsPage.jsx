import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTransactionsByParty, getSuppliers, getCustomers } from '../services/apiService';

const PartyDetailsPage = () => {
  const { partyType, partyId } = useParams();
  const navigate = useNavigate();
  
  const [party, setParty] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPartyAndTransactions();
  }, [partyId, partyType]);

  const fetchPartyAndTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch party details
      const partyResponse = partyType === 'supplier' 
        ? await getSuppliers() 
        : await getCustomers();
      
      const partyData = partyResponse.data.find(p => p._id === partyId);
      if (!partyData) {
        setError('Party not found');
        return;
      }
      setParty(partyData);

      // Fetch transactions for this party
      const transactionsResponse = await getTransactionsByParty(partyId, {
        limit: 1000 // Get all transactions for this party
      });
      
      setTransactions(transactionsResponse.data.items || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedTransactions = () => {
    let filtered = transactions.filter(transaction =>
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.mode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.amount.toString().includes(searchTerm)
    );

    // Compute running balance in true chronological order
    const chronological = [...filtered].sort((a, b) => {
      const byDate = new Date(a.date) - new Date(b.date);
      if (byDate !== 0) return byDate;
      const byCreated = (a.createdAt ? new Date(a.createdAt) : 0) - (b.createdAt ? new Date(b.createdAt) : 0);
      if (byCreated !== 0) return byCreated;
      return (a._id || '').localeCompare(b._id || '');
    });

    let runningBalance = 0;
    const idToBalance = new Map();
    for (const transaction of chronological) {
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

    // Attach the correct running balance to each row regardless of display order
    return displaySorted.map(t => ({ ...t, runningBalance: idToBalance.get(t._id) || 0 }));
  };

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

  const calculateTotalAmount = () => {
    return transactions.reduce((total, transaction) => {
      // For suppliers: Purchase and Payment Out are positive (we owe them)
      // For customers: Sale and Payment In are positive (they owe us)
      if (partyType === 'supplier') {
        return total + (transaction.type === 'Purchase' || transaction.type === 'Payment Out' ? transaction.amount : -transaction.amount);
      } else {
        return total + (transaction.type === 'Sale' || transaction.type === 'Payment In' ? transaction.amount : -transaction.amount);
      }
    }, 0);
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

  const filteredTransactions = filteredAndSortedTransactions();

  return (
    <div>
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
              party?.balance >= 0 
                ? (partyType === 'supplier' ? 'text-red-600' : 'text-green-600')
                : (partyType === 'supplier' ? 'text-green-600' : 'text-red-600')
            }`}>
              ${party?.balance?.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Transactions</h3>
            <p className="mt-2 text-lg text-gray-900">{transactions.length}</p>
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
          </div>
        )}
      </div>


    </div>
  );
};

export default PartyDetailsPage;
