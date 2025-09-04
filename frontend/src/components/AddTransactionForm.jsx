// src/components/AddTransactionForm.jsx
import { useState, useMemo, useEffect } from 'react';
import { createTransaction, updateTransaction } from '../services/apiService';
import AlertDialog from './AlertDialog';

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = () => new Date().toISOString().split('T')[0];

const AddTransactionForm = ({ suppliers, customers, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    date: getTodayString(), // Default date
    type: 'Purchase',
    mode: 'Cash', // Default mode
    partyModel: 'Supplier',
    party: '',
    description: '',
    amount: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ open: false, title: '', message: '' });

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

  const validateForm = () => {
    const newErrors = {};

    // Date validation
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.date = 'Date cannot be in the future';
      }
    }

    // Party validation
    if (!formData.party) {
      newErrors.party = 'Please select a party';
    }

    // Amount validation
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    // Type validation
    if (!formData.type) {
      newErrors.type = 'Transaction type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateTransaction(initialData._id, formData);
      } else {
        await createTransaction(formData);
      }
      // Simple toast
      try {
        const el = document.createElement('div');
        el.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50';
        el.textContent = initialData ? 'Transaction updated successfully' : 'Transaction created successfully';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
      } catch {}
      onSuccess(); // Notify parent component to refresh data
    } catch (error) {
      console.error('Failed to save transaction', error);
      const errorMessage = error.response?.data?.message || 'Failed to save transaction. Please try again.';
      setAlert({ open: true, title: 'Save Failed', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date *
        </label>
        <input 
          type="date" 
          name="date" 
          value={formData.date} 
          onChange={handleChange} 
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 ${
            errors.date ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-600">{errors.date}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select 
            name="type" 
            value={formData.type} 
            onChange={handleChange} 
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 ${
              errors.type ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="Purchase">Purchase</option>
            <option value="Sale">Sale</option>
            <option value="Payment Out">Payment Out</option>
            <option value="Payment In">Payment In</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mode
          </label>
          <select 
            name="mode" 
            value={formData.mode} 
            onChange={handleChange} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
            <option value="Online Payment">Online Payment</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Party ({formData.partyModel}) *
        </label>
        <select 
          name="party" 
          value={formData.party} 
          onChange={handleChange} 
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 ${
            errors.party ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="" disabled>Select a party</option>
          {partyList.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} (Balance: ${p.balance.toLocaleString()})
            </option>
          ))}
        </select>
        {errors.party && (
          <p className="mt-1 text-sm text-red-600">{errors.party}</p>
        )}
        {partyList.length === 0 && (
          <p className="mt-1 text-sm text-yellow-600">
            No {formData.partyModel.toLowerCase()}s found. Please add some first.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount *
        </label>
        <input 
          type="number" 
          name="amount" 
          value={formData.amount} 
          onChange={handleChange} 
          step="0.01"
          min="0"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 ${
            errors.amount ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="0.00"
        />
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
          rows="3"
          placeholder="Enter transaction description..."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={() => onSuccess()} // Close modal
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 border border-transparent rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Transaction' : 'Save Transaction')}
        </button>
      </div>
    </form>
    /* Alert Dialog */
    <AlertDialog
      isOpen={alert.open}
      title={alert.title}
      message={alert.message}
      onClose={() => setAlert({ open: false, title: '', message: '' })}
    />
    </>
  );
};

export default AddTransactionForm;