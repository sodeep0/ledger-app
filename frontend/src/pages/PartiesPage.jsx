import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSuppliers, getCustomers, createSupplier, createCustomer, updateSupplier, updateCustomer, deleteSupplier, deleteCustomer, getTransactionsByParty } from '../services/apiService';
import Modal from '../components/Modal';

const PartiesPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [formData, setFormData] = useState({ name: '', contactInfo: '' });
  const [formErrors, setFormErrors] = useState({});
  const [balancesByKey, setBalancesByKey] = useState({}); // key format: `${partyType}:${id}`
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [lastComputedData, setLastComputedData] = useState({ suppliers: [], customers: [] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppliersRes, customersRes] = await Promise.all([
        getSuppliers(),
        getCustomers(),
      ]);
      setSuppliers(suppliersRes.data);
      setCustomers(customersRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Compute balances from all transactions for each party
  useEffect(() => {
    const computeBalanceForType = async (parties, partyType) => {
      if (!parties || parties.length === 0) return;
      try {
        setBalancesLoading(true);
        const results = await Promise.all(parties.map(async (p) => {
          const res = await getTransactionsByParty(p._id, { limit: 1000 });
          const items = res?.data?.items || [];
          // Compute running total based on party type and transaction type
          let total = 0;
          for (const t of items.sort((a, b) => new Date(a.date) - new Date(b.date))) {
            if (partyType === 'suppliers') {
              if (t.type === 'Purchase') total += t.amount;
              else if (t.type === 'Payment Out') total -= t.amount;
              else total -= t.amount;
            } else {
              if (t.type === 'Sale') total += t.amount;
              else if (t.type === 'Payment In') total -= t.amount;
              else total -= t.amount;
            }
          }
          return { key: `${partyType === 'suppliers' ? 'supplier' : 'customer'}:${p._id}`, total };
        }));
        setBalancesByKey((prev) => {
          const next = { ...prev };
          for (const r of results) next[r.key] = r.total;
          return next;
        });
      } catch (e) {
        console.error('Failed to compute balances', e);
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
      computeBalanceForType(suppliers, 'suppliers');
      computeBalanceForType(customers, 'customers');
    }
  }, [suppliers, customers]);

  const getComputedBalance = (party, tab) => {
    const typeKey = tab === 'suppliers' ? 'supplier' : 'customer';
    const key = `${typeKey}:${party._id}`;
    const computed = balancesByKey[key];
    
    // If balances are still loading, return null to show loading state
    if (balancesLoading && typeof computed !== 'number') {
      return null;
    }
    
    // Return computed balance if available, otherwise fallback to party balance
    return typeof computed === 'number' ? computed : (party.balance || 0);
  };

  const validateForm = () => {
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
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone) => {
    return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingParty) {
        if (activeTab === 'suppliers') {
          await updateSupplier(editingParty._id, formData);
        } else {
          await updateCustomer(editingParty._id, formData);
        }
      } else {
        if (activeTab === 'suppliers') {
          await createSupplier(formData);
        } else {
          await createCustomer(formData);
        }
      }
      
      setIsModalOpen(false);
      setEditingParty(null);
      setFormData({ name: '', contactInfo: '' });
      setFormErrors({});
      fetchData();
    } catch (error) {
      console.error('Failed to save party', error);
      alert('Failed to save party. Please try again.');
    }
  };

  const handleEdit = (party) => {
    setEditingParty(party);
    setFormData({ name: party.name, contactInfo: party.contactInfo });
    setFormErrors({});
    setIsModalOpen(true);
  };

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

  const handleAddNew = () => {
    setEditingParty(null);
    setFormData({ name: '', contactInfo: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handlePartyClick = (party) => {
    const partyType = activeTab === 'suppliers' ? 'supplier' : 'customer';
    navigate(`/parties/${partyType}/${party._id}`);
  };

  const filteredAndSortedData = () => {
    const data = activeTab === 'suppliers' ? suppliers : customers;
    let filtered = data.filter(item => {
      const bal = getComputedBalance(item, activeTab);
      return (
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contactInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bal !== null && bal.toString().includes(searchTerm))
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
  };

  const formatContact = (contact) => {
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
          onClick={fetchData}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  const data = filteredAndSortedData();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Parties</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'suppliers'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Suppliers
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'customers'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Customers
            </button>
          </nav>
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
              placeholder="Search by name, contact, or balance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
          >
            <option value="name">Sort by Name</option>
            <option value="balance">Sort by Balance</option>
            <option value="lastTransaction">Sort by Last Transaction</option>
          </select>
          
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Add {activeTab === 'suppliers' ? 'Supplier' : 'Customer'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {data.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab}</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new {activeTab.slice(0, -1)}.
            </p>
            <div className="mt-6">
              <button
                onClick={handleAddNew}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Add {activeTab === 'suppliers' ? 'Supplier' : 'Customer'}
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Transaction
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((party) => (
                  <tr key={party._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handlePartyClick(party)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{party.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatContact(party.contactInfo)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const bal = getComputedBalance(party, activeTab);
                        
                        // Show loading state if balance is being computed
                        if (bal === null) {
                          return (
                            <div className="inline-flex items-center px-2 py-1 text-xs text-gray-500">
                              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Calculating...
                            </div>
                          );
                        }
                        
                        const positive = bal >= 0;
                        const cls = positive
                          ? (activeTab === 'suppliers' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')
                          : (activeTab === 'suppliers' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800');
                        return (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${cls}`}>
                            ${Number(bal || 0).toLocaleString()}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(party.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click when editing
                          handleEdit(party);
                        }}
                        className="text-red-600 hover:text-red-900 mr-4"
                      >
                        Edit
                      </button>
                      
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter name"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Information *
            </label>
            <input
              type="text"
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 ${
                formErrors.contactInfo ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email or phone number"
            />
            {formErrors.contactInfo && (
              <p className="mt-1 text-sm text-red-600">{formErrors.contactInfo}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingParty(null);
                setFormData({ name: '', contactInfo: '' });
                setFormErrors({});
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {editingParty ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PartiesPage;
