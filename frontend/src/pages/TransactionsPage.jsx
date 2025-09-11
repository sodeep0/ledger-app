import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransactions, getSuppliers, getCustomers, createTransaction, updateTransaction, deleteTransaction } from '../services/apiService';
import Modal from '../components/Modal';
import AlertDialog from '../components/AlertDialog';
import AddTransactionForm from '../components/AddTransactionForm';

// ✨ OPTIMIZATION 4: Pure utility function moved outside the component.
// It no longer needs to be wrapped in useCallback or passed as a prop.
const getTypeColor = (type) => {
  const colors = {
    'Purchase': 'bg-blue-100 text-blue-800',
    'Sale': 'bg-green-100 text-green-800',
    'Payment In': 'bg-purple-100 text-purple-800',
    'Payment Out': 'bg-orange-100 text-orange-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

// ✨ OPTIMIZATION 1: Component defined outside the parent.
// This ensures React.memo works effectively, preventing unnecessary re-renders for each row.
const TransactionRow = memo(({ transaction, onEdit, onDelete }) => (
  <tr className="hover:bg-gray-50">
    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
      <div>
        <div className="font-medium">
          {new Date(transaction.date).toLocaleDateString()}
        </div>
        {transaction.createdAt && (
          <div className="text-xs text-gray-500">
            {new Date(transaction.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
    </td>
    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-24 sm:max-w-none">
        {transaction.party?.name || 'Unknown'}
      </div>
      <div className="text-xs text-gray-500 hidden sm:block">
        {transaction.partyModel}
      </div>
    </td>
    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
        {transaction.type}
      </span>
    </td>
    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 font-medium">
      ${transaction.amount.toLocaleString()}
    </td>
    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 max-w-xs truncate hidden sm:table-cell">
      {transaction.description || '-'}
    </td>
    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
      <div className="flex flex-col sm:flex-row gap-1 sm:gap-0">
        <button
          onClick={() => onEdit(transaction)}
          className="text-red-600 hover:text-red-900 sm:mr-4"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(transaction._id)}
          className="text-gray-600 hover:text-gray-900"
        >
          Delete
        </button>
      </div>
    </td>
  </tr>
));

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [alert, setAlert] = useState({ open: false, title: '', message: '' });

  const [filters, setFilters] = useState({
    dateRange: 'all',
    partyType: 'all',
    partyId: 'all',
  });

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // New state for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  // Debounce effect for search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ✨ OPTIMIZATION 2: Fetch static data (suppliers, customers) only once on mount.
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const [suppliersRes, customersRes] = await Promise.all([
          getSuppliers(),
          getCustomers(),
        ]);
        setSuppliers(suppliersRes.data);
        setCustomers(customersRes.data);
      } catch (err) {
        setError('Failed to load initial supplier/customer data.');
        console.error(err);
      }
    };
    fetchStaticData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const transactionsRes = await getTransactions({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        dateRange: filters.dateRange,
        partyType: filters.partyType,
        partyId: filters.partyId,
      });
      setTransactions(transactionsRes.data.items || []);
      setTotalTransactions(transactionsRes.data.total || 0);
      setError(null);
    } catch (err) {
      setError('Failed to fetch transactions. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, filters]);

  // ✨ OPTIMIZATION 2: Fetch dynamic data (transactions) when dependencies change.
  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
    setCurrentPage(1);
  }, []);
  
  const handleEdit = useCallback((transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  }, []);
  
  const handleDelete = useCallback((transactionId) => {
    setSelectedTransactionId(transactionId);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedTransactionId) return;
    try {
      await deleteTransaction(selectedTransactionId);
      fetchData(); // Refetch data after successful delete
      setIsDeleteModalOpen(false);
      setSelectedTransactionId(null);
    } catch (error) {
      console.error('Failed to delete transaction', error);
      setAlert({ open: true, title: 'Delete Failed', message: 'Failed to delete transaction. Please try again.' });
    }
  }, [fetchData, selectedTransactionId]);

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTransactionId(null);
  };
  
  const handleTransactionSuccess = useCallback(() => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    fetchData(); // Refetch data after successful add/edit
  }, [fetchData]);

  const exportToCSV = useCallback(() => {
    const headers = ['Date', 'Time', 'Party Name', 'Type', 'Amount', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => {
        const datePart = new Date(t.date).toLocaleDateString();
        const timePart = t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : '';
        return [
          datePart,
          timePart,
          `"${t.party?.name || ''}"`, // Enclose in quotes to handle commas
          t.type,
          t.amount,
          `"${t.description || ''}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [transactions]);

  
  
  const allParties = useMemo(() => [
    ...suppliers.map(s => ({ ...s, type: 'Supplier' })),
    ...customers.map(c => ({ ...c, type: 'Customer' }))
  ], [suppliers, customers]);
  
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 sm:gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transactions</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Export
            </button>
            <button
              onClick={() => navigate('/transactions/batch')}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-gray-600 hover:bg-gray-700"
            >
              Batch Transactions
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Add Transaction
            </button>
          </div>
        </div>
      </div>
  
      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
  
          {/* Date Range */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
  
          {/* Party Type */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Party Type</label>
            <select
              value={filters.partyType}
              // ✨ OPTIMIZATION 3: Consolidated state update in a single call.
              onChange={(e) => {
                setFilters(prev => ({
                  ...prev,
                  partyType: e.target.value,
                  partyId: 'all' // Reset party selection
                }));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              <option value="Supplier">Suppliers</option>
              <option value="Customer">Customers</option>
            </select>
          </div>
  
          {/* Specific Party */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Party</label>
            <select
              value={filters.partyId}
              onChange={(e) => handleFilterChange('partyId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Parties</option>
              {allParties
                .filter(party => filters.partyType === 'all' || party.type === filters.partyType)
                .map(party => (
                  <option key={`${party.type}-${party._id}`} value={party._id}>
                    {party.name} ({party.type})
                  </option>
                ))
              }
            </select>
          </div>
        </div>
      </div>
  
      {/* Transactions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party Name
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Notes
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 sm:py-10 text-sm">Loading...</td></tr>
              ) : (
                transactions.map((transaction) => (
                  <TransactionRow
                    key={transaction._id}
                    transaction={transaction}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
                 
         {/* Pagination */}
         <div className="bg-white px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between border-t border-gray-200">
           <div className="flex-1 flex justify-between sm:hidden">
             <button
               onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
               disabled={currentPage === 1}
               className="relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Previous
             </button>
             <button
               onClick={() => setCurrentPage(prev => prev + 1)}
               disabled={transactions.length < pageSize}
               className="ml-3 relative inline-flex items-center px-3 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Next
             </button>
           </div>
           <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
             <div>
               <p className="text-xs sm:text-sm text-gray-700">
                 Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                 <span className="font-medium">
                   {Math.min(currentPage * pageSize, totalTransactions)}
                 </span>{' '}
                 of <span className="font-medium">{totalTransactions}</span> results
               </p>
             </div>
             <div className="flex items-center space-x-2 sm:space-x-4">
               <select
                 value={pageSize}
                 onChange={(e) => {
                   setPageSize(parseInt(e.target.value));
                   setCurrentPage(1);
                 }}
                 className="border border-gray-300 rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm"
               >
                 <option value={10}>10</option>
                 <option value={25}>25</option>
                 <option value={50}>50</option>
                 <option value={100}>100</option>
               </select>
               <div className="flex space-x-1 sm:space-x-2">
                 <button
                   onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                   disabled={currentPage === 1}
                   className="relative inline-flex items-center px-2 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Previous
                 </button>
                 <button
                   onClick={() => setCurrentPage(prev => prev + 1)}
                   disabled={transactions.length < pageSize}
                   className="relative inline-flex items-center px-2 py-2 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Next
                 </button>
               </div>
             </div>
           </div>
         </div>
       </div>
  
      {/* Summary Footer */}

      {/* Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? "Edit Transaction" : "Add New Transaction"}
      >
        <AddTransactionForm
          suppliers={suppliers}
          customers={customers}
          onSuccess={handleTransactionSuccess}
          initialData={editingTransaction}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Confirm Deletion"
      >
        <div className="p-4">
          <p className="text-gray-700 mb-4">Are you sure you want to delete this transaction? This action cannot be undone.</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCloseDeleteModal}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <AlertDialog
        isOpen={alert.open}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ open: false, title: '', message: '' })}
      />
    </div>
  );
};

export default TransactionsPage;