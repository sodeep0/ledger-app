/**
 * PartiesPage Component
 * 
 * This component manages the display and interaction with suppliers and customers.
 * It provides functionality to:
 * - View lists of suppliers and customers with computed balances
 * - Add new parties (suppliers/customers)
 * - Edit existing party information
 * - Navigate to individual party detail pages
 * - Search and sort party data
 * 
 * Key Features:
 * - Real-time balance calculation from transaction history
 * - Responsive design with mobile-friendly interface
 * - Optimized performance with memoized calculations
 * - Consistent UI using the design system
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSuppliers, getCustomers, createSupplier, createCustomer, updateSupplier, updateCustomer, deleteSupplier, deleteCustomer, getTransactionsByParty } from '../services/apiService';
import Modal from '../components/Modal';
import ErrorBoundary from '../components/ErrorBoundary';
import VirtualTable from '../components/VirtualTable';
import { Button, Input, FormField, Toast } from '../components/ui';
import { useForm, useToast } from '../hooks';
import { usePerformanceMonitor, useAsyncPerformance } from '../hooks/usePerformanceMonitor';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { formatCurrency, calculateBalance, filterBySearch, sortBy } from '../utils';

const PartiesPage = () => {
  const navigate = useNavigate();
  
  // UI State Management
  const [activeTab, setActiveTab] = useState('suppliers'); // Current tab: 'suppliers' or 'customers'
  const [searchTerm, setSearchTerm] = useState(''); // Search filter term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // Debounced search term
  const [sortBy, setSortBy] = useState('name'); // Sort criteria: 'name', 'balance', 'lastTransaction'
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility state
  
  // Data State Management
  const [suppliers, setSuppliers] = useState([]); // Suppliers list
  const [customers, setCustomers] = useState([]); // Customers list
  const [loading, setLoading] = useState(true); // Initial data loading state
  const [error, setError] = useState(null); // Error state for API calls
  
  // Form State Management
  const [editingParty, setEditingParty] = useState(null); // Currently editing party
  const [formData, setFormData] = useState({ name: '', contactInfo: '' }); // Form input values
  const [formErrors, setFormErrors] = useState({}); // Form validation errors
  const [isSubmitting, setIsSubmitting] = useState(false); // Form submission state
  
  // Balance Calculation State
  // Optimized balance calculation to avoid redundant API calls
  const [balancesByKey, setBalancesByKey] = useState({}); // Cached balances: `${partyType}:${id}`
  const [balancesLoading, setBalancesLoading] = useState(false); // Balance calculation loading state
  const [lastComputedData, setLastComputedData] = useState({ suppliers: [], customers: [] }); // Track data changes
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 }); // For lazy loading
  const [intersectionObserver, setIntersectionObserver] = useState(null); // For intersection-based lazy loading
  
  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '' });

  // Performance monitoring
  usePerformanceMonitor('PartiesPage');
  const { measureAsync } = useAsyncPerformance();
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const result = await measureAsync(async () => {
      const [suppliersRes, customersRes] = await Promise.all([
        getSuppliers(),
        getCustomers(),
      ]);
        return { suppliersRes, customersRes };
      }, 'fetchPartiesData');
      
      setSuppliers(result.suppliersRes.data);
      setCustomers(result.customersRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [measureAsync]);
  // Pull-to-refresh functionality
  const { elementRef: pullToRefreshRef, refreshState, triggerRefresh } = usePullToRefresh(
    fetchData,
    {
      threshold: 80,
      resistance: 0.5,
      maxPullDistance: 120,
      refreshTimeout: 2000,
    }
  );


  

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup intersection observer on unmount
  useEffect(() => {
    return () => {
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
    };
  }, [intersectionObserver]);

  // Debounced search effect - reduces API calls and improves performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /**
   * Optimized Balance Calculation Effect with Lazy Loading
   * 
   * This effect computes real-time balances for visible parties only with optimizations:
   * 1. Lazy loading - only calculate balances for visible items
   * 2. Batch processing with controlled concurrency
   * 3. Incremental updates to avoid full recalculation
   * 4. Smart caching with dependency tracking
   * 5. Reduced API calls through intelligent batching
   * 
   * Balance Logic:
   * - Suppliers: Purchase increases balance, Payment Out decreases balance
   * - Customers: Sale increases balance, Payment In decreases balance
   */
  useEffect(() => {
    const computeBalanceForVisibleParties = async (parties, partyType) => {
      if (!parties || parties.length === 0) return;
      
      try {
        setBalancesLoading(true);
        
        // Only compute balances for visible parties (lazy loading)
        const visibleParties = parties.slice(visibleRange.start, visibleRange.end);
        if (visibleParties.length === 0) return;
        
        // Batch process with controlled concurrency (max 5 concurrent requests)
        const batchSize = 5;
        
        for (let i = 0; i < visibleParties.length; i += batchSize) {
          const batch = visibleParties.slice(i, i + batchSize);
          const batchResults = await Promise.all(batch.map(async (party) => {
            const key = `${partyType === 'suppliers' ? 'supplier' : 'customer'}:${party._id}`;
            
            // Skip if already computed
            if (balancesByKey[key] !== undefined) {
              return { key, total: balancesByKey[key] };
            }
            
          const res = await getTransactionsByParty(party._id, { limit: 1000 });
          const transactions = res?.data?.items || [];
          
          // Calculate balance using utility function for consistency
          const balance = calculateBalance(transactions, partyType);
          
            return { key, total: balance };
        }));
        
          // Update balances incrementally for better UX
        setBalancesByKey((prev) => {
          const next = { ...prev };
            for (const result of batchResults) {
            next[result.key] = result.total;
          }
          return next;
        });
        }
      } catch (error) {
        console.error('Failed to compute balances', error);
      } finally {
        setBalancesLoading(false);
      }
    };

    // Only compute balances if data has changed and we're not already loading
    const dataChanged = 
      JSON.stringify(suppliers.map(s => s._id)) !== JSON.stringify(lastComputedData.suppliers) ||
      JSON.stringify(customers.map(c => c._id)) !== JSON.stringify(lastComputedData.customers);
    
    if (dataChanged && !balancesLoading && (suppliers.length > 0 || customers.length > 0)) {
      setLastComputedData({
        suppliers: suppliers.map(s => s._id),
        customers: customers.map(c => c._id)
      });
      computeBalanceForVisibleParties(suppliers, 'suppliers');
      computeBalanceForVisibleParties(customers, 'customers');
    }
  }, [suppliers, customers, visibleRange, balancesByKey]);

  const getComputedBalance = useCallback((party, tab) => {
    const typeKey = tab === 'suppliers' ? 'supplier' : 'customer';
    const key = `${typeKey}:${party._id}`;
    const computed = balancesByKey[key];
    
    // If balances are still loading, return null to show loading state
    if (balancesLoading && typeof computed !== 'number') {
      return null;
    }
    
    // Return computed balance if available, otherwise fallback to party balance
    return typeof computed === 'number' ? computed : (party.balance || 0);
  }, [balancesByKey, balancesLoading]);

  const isValidEmail = useCallback((email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  const isValidPhone = useCallback((phone) => {
    return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.contactInfo.trim()) {
      errors.contactInfo = 'Contact information is required';
    } else if (!isValidEmail(formData.contactInfo) && !isValidPhone(formData.contactInfo)) {
      errors.contactInfo = 'Please enter a valid email or phone number';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, isValidEmail, isValidPhone]);

  const showToast = useCallback((message) => {
    setToast({ show: true, message });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingParty) {
        if (activeTab === 'suppliers') {
          await updateSupplier(editingParty._id, formData);
        } else {
          await updateCustomer(editingParty._id, formData);
        }
        showToast('Party updated successfully!');
      } else {
        if (activeTab === 'suppliers') {
          await createSupplier(formData);
        } else {
          await createCustomer(formData);
        }
        showToast('Party created successfully!');
      }
      
      setIsModalOpen(false);
      setEditingParty(null);
      setFormData({ name: '', contactInfo: '' });
      setFormErrors({});
      fetchData();
    } catch (error) {
      console.error('Failed to save party', error);
      setFormErrors({ form: error.response?.data?.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, editingParty, activeTab, formData, showToast, fetchData]);

  const handleEdit = useCallback((party) => {
    setEditingParty(party);
    setFormData({ name: party.name, contactInfo: party.contactInfo });
    setFormErrors({});
    setIsModalOpen(true);
  }, []);

  // const handleDelete = async (partyId) => {
  //   if (!window.confirm('Are you sure you want to delete this party?')) return;

  //   try {
  //     if (activeTab === 'suppliers') {
  //       await deleteSupplier(partyId);
  //     } else {
  //       await deleteCustomer(partyId);
  //     }
  //     fetchData();
  //   } catch (error) {
  //     console.error('Failed to delete party', error);
  //     alert('Failed to delete party. Please try again.');
  //   }
  // };

  const handleAddNew = useCallback(() => {
    setEditingParty(null);
    setFormData({ name: '', contactInfo: '' });
    setFormErrors({});
    setIsModalOpen(true);
  }, []);

  const handleFormDataChange = useCallback((newFormData) => {
    setFormData(newFormData);
  }, []);

  const handlePartyClick = useCallback((party) => {
    const partyType = activeTab === 'suppliers' ? 'supplier' : 'customer';
    navigate(`/parties/${partyType}/${party._id}`);
  }, [activeTab, navigate]);

  const filteredAndSortedData = useMemo(() => {
    const data = activeTab === 'suppliers' ? suppliers : customers;
    let filtered = data.filter(item => {
      const bal = getComputedBalance(item, activeTab);
      return (
        item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.contactInfo.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (bal !== null && bal.toString().includes(debouncedSearchTerm))
      );
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'balance': {
          const balA = getComputedBalance(a, activeTab);
          const balB = getComputedBalance(b, activeTab);
          // Handle loading state - put items with null balance at the end
          if (balA === null && balB === null) return 0;
          if (balA === null) return 1;
          if (balB === null) return -1;
          return balB - balA;
        }
        case 'lastTransaction':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [suppliers, customers, activeTab, debouncedSearchTerm, sortBy, getComputedBalance]);


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
        <div className="text-error-600 mb-4">{error}</div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-error-600 text-white rounded hover:bg-error-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const data = filteredAndSortedData;

  return (
    <ErrorBoundary>
    <div ref={pullToRefreshRef} className="relative">
      {/* Pull-to-refresh indicator */}
      {refreshState.isPulling && (
        <div 
          className="absolute top-0 left-0 right-0 bg-primary-50 border-b border-primary-200 flex items-center justify-center transition-all duration-200"
          style={{ 
            height: `${Math.min(refreshState.pullDistance, 80)}px`,
            transform: `translateY(${Math.max(0, refreshState.pullDistance - 80)}px)`
          }}
        >
          <div className="flex items-center space-x-2 text-primary-600">
            {refreshState.shouldRefresh ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium">Release to refresh</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span className="text-sm font-medium">Pull to refresh</span>
              </>
            )}
          </div>
        </div>
      )}


      {/* Header */}
        <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Parties</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'suppliers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Suppliers
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'customers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Customers
            </button>
          </nav>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name, contact, or balance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between sm:items-center">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="name">Sort by Name</option>
            <option value="balance">Sort by Balance</option>
            <option value="lastTransaction">Sort by Last Transaction</option>
          </select>
          
          <div className="flex gap-2 sm:ml-auto items-center">
            <button
              onClick={triggerRefresh}
              disabled={refreshState.isRefreshing}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data"
            >
              <svg className={`w-4 h-4 ${refreshState.isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {refreshState.isRefreshing && (
              <div className="flex items-center text-xs text-gray-500">
                <svg className="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Refreshing...</span>
              </div>
            )}
          <button
            onClick={handleAddNew}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm sm:text-base"
          >
            Add {activeTab === 'suppliers' ? 'Supplier' : 'Customer'}
          </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <PartyTable
          data={data}
          activeTab={activeTab}
          onEdit={handleEdit}
          onPartyClick={handlePartyClick}
          getComputedBalance={getComputedBalance}
        />
        
      </div>

      {/* Toast */}
      <Toast 
        message={toast.message} 
        show={toast.show} 
        type="success"
        duration={2000}
        onClose={() => {
          setToast({ show: false, message: '' });
        }}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingParty(null);
          setFormData({ name: '', contactInfo: '' });
          setFormErrors({});
        }}
        title={editingParty ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}
      >
        <PartyForm
          formData={formData}
          formErrors={formErrors}
          onSubmit={handleSubmit}
          onFormDataChange={handleFormDataChange}
          isSubmitting={isSubmitting}
          editingParty={editingParty}
          activeTab={activeTab}
        />
      </Modal>
      </div>
    </ErrorBoundary>
  );
};

// Memoized Components for Performance Optimization

/**
 * PartyRow Component - Memoized for performance
 * Renders individual party row with optimized re-rendering
 */
const PartyRow = memo(({ party, activeTab, onEdit, onPartyClick, getComputedBalance }) => {
  const handleEditClick = useCallback((e) => {
    e.stopPropagation();
    onEdit(party);
  }, [party, onEdit]);

  const handleRowClick = useCallback(() => {
    onPartyClick(party);
  }, [party, onPartyClick]);

  const balance = useMemo(() => getComputedBalance(party, activeTab), [party, activeTab, getComputedBalance]);

  const formatContact = useCallback((contact) => {
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    if (isValidEmail(contact)) {
      return (
        <div className="flex items-center">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {contact}
        </div>
      );
    } else {
      return (
        <div className="flex items-center">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {contact}
        </div>
      );
    }
  }, []);

  const balanceDisplay = useMemo(() => {
    if (balance === null) {
      return (
        <div className="inline-flex items-center px-2 py-1 text-xs text-gray-500">
          <svg className="animate-spin -ml-1 mr-1 sm:mr-2 h-3 w-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="hidden sm:inline">Calculating...</span>
        </div>
      );
    }
    
    const positive = balance >= 0;
    const cls = positive
      ? (activeTab === 'suppliers' ? 'bg-warning-100 text-warning-800' : 'bg-success-100 text-success-800')
      : (activeTab === 'suppliers' ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800');
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>
        ${Number(balance || 0).toLocaleString()}
      </span>
    );
  }, [balance, activeTab]);

  return (
    <tr key={party._id} className="hover:bg-gray-50 cursor-pointer" onClick={handleRowClick}>
      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-24 sm:max-w-none">{party.name}</div>
        <div className="text-xs text-gray-500 sm:hidden truncate max-w-24">{party.contactInfo}</div>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
        <div className="text-xs sm:text-sm text-gray-900">{formatContact(party.contactInfo)}</div>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
        {balanceDisplay}
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
        <div className="text-xs sm:text-sm text-gray-500">
          {new Date(party.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
        </div>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-0">
          <button
            onClick={handleEditClick}
            className="text-red-600 hover:text-red-900 sm:mr-4"
          >
            Edit
          </button>
        </div>
      </td>
    </tr>
  );
});

PartyRow.displayName = 'PartyRow';

/**
 * PartyTable Component - Memoized for performance with virtual scrolling
 * Renders the table with optimized re-rendering and virtual scrolling for large datasets
 */
const PartyTable = memo(({ data, activeTab, onEdit, onPartyClick, getComputedBalance }) => {
  const renderRow = useCallback((party, index) => (
    <PartyRow
      key={party._id}
      party={party}
      activeTab={activeTab}
      onEdit={onEdit}
      onPartyClick={onPartyClick}
      getComputedBalance={getComputedBalance}
    />
  ), [activeTab, onEdit, onPartyClick, getComputedBalance]);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab}</h3>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Get started by creating a new {activeTab.slice(0, -1)}.
        </p>
      </div>
    );
  }

  // Use virtual scrolling for large datasets (>50 items)
  if (data.length > 50) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Contact
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                Last Transaction
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
        </table>
        <VirtualTable
          data={data}
          renderRow={renderRow}
          rowHeight={60}
          containerHeight={400}
          overscan={5}
        />
      </div>
    );
  }

  // Regular table for smaller datasets
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
              Contact
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Balance
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
              Last Transaction
            </th>
            <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((party) => (
            <PartyRow
              key={party._id}
              party={party}
              activeTab={activeTab}
              onEdit={onEdit}
              onPartyClick={onPartyClick}
              getComputedBalance={getComputedBalance}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});

PartyTable.displayName = 'PartyTable';

/**
 * PartyForm Component - Memoized for performance
 * Renders the form with optimized re-rendering
 */
const PartyForm = memo(({ 
  formData, 
  formErrors, 
  onSubmit, 
  onFormDataChange,
  isSubmitting, 
  editingParty, 
  activeTab 
}) => {
  const handleFormSubmit = useCallback((e) => {
    e.preventDefault();
    onSubmit(e);
  }, [onSubmit]);

  const handleNameChange = useCallback((e) => {
    onFormDataChange({ ...formData, name: e.target.value });
  }, [formData, onFormDataChange]);

  const handleContactChange = useCallback((e) => {
    onFormDataChange({ ...formData, contactInfo: e.target.value });
  }, [formData, onFormDataChange]);

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6 p-1">
          <FormField 
            label="Name" 
            name="name" 
            required 
            error={formErrors.name}
          >
            <Input
              type="text"
              name="name"
              value={formData.name}
          onChange={handleNameChange}
              error={!!formErrors.name}
              leftIcon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              placeholder="Enter name"
            />
          </FormField>
          
          <FormField 
            label="Contact Information" 
            name="contactInfo" 
            required 
            error={formErrors.contactInfo}
          >
            <Input
              type="text"
              name="contactInfo"
              value={formData.contactInfo}
          onChange={handleContactChange}
              error={!!formErrors.contactInfo}
              leftIcon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              placeholder="Enter email or phone number"
            />
          </FormField>
          
          {formErrors.form && <p className="text-sm text-error-600 text-center">{formErrors.form}</p>}
          
          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full"
            >
              {editingParty ? 'Update Party' : 'Create Party'}
            </Button>
          </div>
        </form>
  );
});

PartyForm.displayName = 'PartyForm';

export default PartiesPage;
