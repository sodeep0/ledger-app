// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { getSuppliers,createSupplier , getCustomers,createCustomer ,getTransactions,createTransaction, deleteTransaction } from '../services/apiService';
import Modal from '../components/Modal'; // Import the Modal
import AddTransactionForm from '../components/AddTransactionForm';

const DashboardPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [txnPage, setTxnPage] = useState(1);
  const [txnLimit, setTxnLimit] = useState(10);
  const [txnMeta, setTxnMeta] = useState({ total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'supplier' | 'customer'
  const [newSupplier, setNewSupplier] = useState({ name: '', contactInfo: '' });
  const [newCustomer, setNewCustomer] = useState({ name: '', contactInfo: '' });
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
    const [editingTransaction, setEditTransaction] = useState(null); // New state for editing

  // Fetch suppliers, customers, and transactions on component mount



  useEffect(() => {
    const fetchCoreLists = async () => {
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
    fetchCoreLists();
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await getTransactions({ page: txnPage, limit: txnLimit });
        setTransactions(res.data.items || []);
        setTxnMeta({
          total: res.data.total,
          totalPages: res.data.totalPages,
          hasNextPage: res.data.hasNextPage,
          hasPrevPage: res.data.hasPrevPage,
        });
      } catch (err) {
        console.error(err);
        setError('Failed to fetch transactions');
      }
    };
    fetchTransactions();
  }, [txnPage, txnLimit]);
  
  const handleInputChange = (e) => {
    setNewSupplier({ ...newSupplier, [e.target.name]: e.target.value });
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      await createSupplier(newSupplier);
      setIsModalOpen(false); // Close modal on success
      setModalType(null);
      setNewSupplier({ name: '', contactInfo: '' }); // Reset form

      // Refresh the suppliers list to show the new one
      const updatedSuppliers = await getSuppliers();
      setSuppliers(updatedSuppliers.data);

    } catch (error) {
      console.error("Failed to add supplier", error);
      alert("Failed to add supplier");
    }
  };
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await createCustomer(newCustomer);
      setIsModalOpen(false); // Close modal on success
      setModalType(null);
      setNewCustomer({ name: '', contactInfo: '' }); // Reset form
        // Refresh the customers list to show the new one
        const updatedCustomers = await getCustomers();
        setCustomers(updatedCustomers.data);
    } catch (error) {
      console.error("Failed to add customer", error);
      alert("Failed to add customer");
    }   
    };
    const handleTransactionCreated = () => {
        setIsTxnModalOpen(false);
        // We need to re-fetch everything because balances will have changed
        const fetchData = async () => {
            const [suppliersRes, customersRes, transactionsRes] = await Promise.all([
                getSuppliers(),
                getCustomers(),
                getTransactions({ page: txnPage, limit: txnLimit }),
            ]);
            setSuppliers(suppliersRes.data);
            setCustomers(customersRes.data);
            setTransactions(transactionsRes.data.items || []);
            setTxnMeta({
              total: transactionsRes.data.total,
              totalPages: transactionsRes.data.totalPages,
              hasNextPage: transactionsRes.data.hasNextPage,
              hasPrevPage: transactionsRes.data.hasPrevPage,
            });
        };
        fetchData();
    };
     const handleDelete = async (transactionId) => {
    // Ask for confirmation before deleting
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(transactionId);
        // Refresh all data to reflect the changes
        handleTransactionCreated(); // We can reuse this function to refresh
      } catch (error) {
        console.error('Failed to delete transaction', error);
        alert('Failed to delete transaction');
      }
    }
    };
    const handleEdit = (transaction) => {
        setEditTransaction(transaction);
        setIsTxnModalOpen(true);
    };
    const closeModal = () => {
        setIsTxnModalOpen(false);
        setEditTransaction(null);
    };

  // Render loading, error, or the main dashboard

  if (loading) {
    return <div className="text-center mt-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>;
  }

  return (
    <div> {/* Add a wrapping div */}
        <div className="mb-4">
            <button 
                onClick={() => setIsTxnModalOpen(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 font-bold"
            >
                + New Transaction
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Suppliers Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-2">Suppliers</h2>
         <button 
      onClick={() => { setIsModalOpen(true); setModalType('supplier'); }}
      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
    >
      + Add
    </button>
        <ul>
          {suppliers.map((s) => (
            <li key={s._id} className="flex justify-between border-b py-1">
              <span>{s.name}</span>
              <span className={s.balance >= 0 ? 'text-red-600' : 'text-green-600'}>
                {s.balance.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Customers Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-2">Customers</h2>
            <button
        onClick={() => { setIsModalOpen(true); setModalType('customer'); }}
        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
        + Add
        </button>
        <ul>
          {customers.map((c) => (
            <li key={c._id} className="flex justify-between border-b py-1">
              <span>{c.name}</span>
              <span className={c.balance > 0 ? 'text-green-600' : 'text-red-600'}>
                {c.balance.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent Transactions Card */}
      <div className="bg-white p-4 rounded-lg shadow md:col-span-3">
        <h2 className="text-xl font-bold mb-2">Recent Transactions</h2>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            Page {txnPage} of {txnMeta.totalPages} • Total {txnMeta.total}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={!txnMeta.hasPrevPage}
              onClick={() => setTxnPage((p) => Math.max(1, p - 1))}
              className={`px-2 py-1 rounded border ${txnMeta.hasPrevPage ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              Prev
            </button>
            <button
              disabled={!txnMeta.hasNextPage}
              onClick={() => setTxnPage((p) => p + 1)}
              className={`px-2 py-1 rounded border ${txnMeta.hasNextPage ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              Next
            </button>
            <select
              value={txnLimit}
              onChange={(e) => { setTxnPage(1); setTxnLimit(parseInt(e.target.value, 10)); }}
              className="ml-2 border rounded px-2 py-1"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Description</th>
                <th className="text-left py-2">Type</th>
                <th className="text-right py-2">Amount</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id} className="border-b">
                  <td className="py-2">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="py-2">{t.description || t.party.name}</td>
                  <td className="py-2">{t.type}</td>
                  <td className="text-right py-2">{t.amount.toLocaleString()}</td>
        <td className="py-2 text-center"> {/* <-- ADD THIS CELL */}
          <button onClick={()=>handleEdit(t)} className="text-blue-600 hover:underline mr-2">Edit</button>
          <button 
            onClick={() => handleDelete(t._id)}
            className="text-red-600 hover:underline"
          >
            Delete
          </button>
        </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      
      </div>
        </div>
    
      <Modal isOpen={isModalOpen && modalType === 'supplier'} onClose={() => { setIsModalOpen(false); setModalType(null); }} title="Add New Supplier">
  <form onSubmit={handleAddSupplier}>
    <div className="mb-4">
      <label className="block mb-1">Name</label>
      <input 
        type="text" 
        name="name" 
        value={newSupplier.name}
        onChange={handleInputChange}
        className="w-full border p-2 rounded" 
        required 
      />
    </div>
    <div className="mb-4">
      <label className="block mb-1">Contact Info</label>
      <input 
        type="text" 
        name="contactInfo" 
        value={newSupplier.contactInfo}
        onChange={handleInputChange}
        className="w-full border p-2 rounded" 
      />
    </div>
    <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
      Save Supplier
    </button>
  </form>
</Modal>
<Modal isOpen={isModalOpen && modalType === 'customer'} onClose={() => { setIsModalOpen(false); setModalType(null); }} title="Add New Customer">
    <form onSubmit={handleAddCustomer}>
        <div className="mb-4">
        <label className="block mb-1">Name</label>
        <input

            type="text"
            name="name"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            className="w-full border p-2 rounded"
            required
        />
        </div>
        <div className="mb-4">
        <label className="block mb-1">Contact Info</label>
        <input

            type="text"
            name="contactInfo"
            value={newCustomer.contactInfo}
            onChange={(e) => setNewCustomer({ ...newCustomer, contactInfo: e.target.value })}
            className="w-full border p-2 rounded"
        />
        </div>
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
        Save Customer
        </button>
    </form>
</Modal>
<Modal isOpen={isTxnModalOpen} onClose={closeModal} title={editingTransaction ? "Edit Transaction" : "Add New Transaction"}>
            <AddTransactionForm 
                suppliers={suppliers} 
                customers={customers} 
                onSuccess={handleTransactionCreated} 
                initialData={editingTransaction}
            />
        </Modal>
    </div>
  );
};

export default DashboardPage;