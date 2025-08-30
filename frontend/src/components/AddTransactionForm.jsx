// src/components/AddTransactionForm.jsx
import { useState,useMemo,useEffect } from 'react';
import { createTransaction,updateTransaction } from '../services/apiService';

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = () => new Date().toISOString().split('T')[0];

const AddTransactionForm = ({ suppliers, customers, onSuccess,initialData }) => {
  const [formData, setFormData] = useState({
    date: getTodayString(), // Default date
    type: 'Purchase',
    mode: 'Cash', // Default mode
    partyModel: 'Supplier',
    party: '',
    description: '',
    amount: '',
  });
   useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                date: new Date(initialData.date).toISOString().split('T')[0], // Format date correctly
                party: initialData.party._id, // Ensure we use the ID
            });
        }
    }, [initialData]);

  // This memoized value updates the party list when the type changes
  const partyList = useMemo(() => {
    return formData.partyModel === 'Supplier' ? suppliers : customers;
  }, [formData.partyModel, suppliers, customers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newState = { ...formData, [name]: value };

    // If the transaction type changes, update the party model accordingly
    if (name === 'type') {
      if (value === 'Purchase' || value === 'Payment Out') {
        newState.partyModel = 'Supplier';
      } else {
        newState.partyModel = 'Customer';
      }
      newState.party = ''; // Reset party selection
    }
    setFormData(newState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        if(initialData){
            await updateTransaction(initialData._id,formData);
        }else {
            await createTransaction(formData);
        }
      onSuccess(); // Notify parent component (Dashboard) to refresh data
    } catch (error) {
      console.error('Failed to create transaction', error);
      alert('Failed to create transaction');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block">Date</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full p-2 border rounded" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block">Type</label>
          <select name="type" value={formData.type} onChange={handleChange} required className="w-full p-2 border rounded">
            <option value="Purchase">Purchase</option>
            <option value="Sale">Sale</option>
            <option value="Payment Out">Payment Out</option>
            <option value="Payment In">Payment In</option>
          </select>
        </div>
        <div>
          <label className="block">Mode</label>
          <select name="mode" value={formData.mode} onChange={handleChange} required className="w-full p-2 border rounded">
            <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
            <option value="Online Payment">Online Payment</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block">Party ({formData.partyModel})</label>
        <select name="party" value={formData.party} onChange={handleChange} required className="w-full p-2 border rounded">
          <option value="" disabled>Select a party</option>
          {partyList.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block">Amount</label>
        <input type="number" name="amount" value={formData.amount} onChange={handleChange} required className="w-full p-2 border rounded" placeholder="0" />
      </div>
      <div>
        <label className="block">Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded" rows="2"></textarea>
      </div>
      <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
        Save Transaction
      </button>
    </form>
  );
};

export default AddTransactionForm;