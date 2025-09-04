// src/components/AddTransactionForm.jsx
import { useState, useReducer, useMemo, useEffect } from 'react';
import { createTransaction, updateTransaction } from '../services/apiService';

// --- Helper Components for a Cleaner UI ---

// NEW: A toggle to switch between Supplier and Customer contexts
const PartyToggle = ({ selectedModel, onToggle }) => {
  const baseClasses = "w-1/2 py-2.5 text-sm font-medium leading-5 text-center transition-colors duration-150 ease-in-out focus:outline-none";
  const activeClasses = "bg-indigo-600 text-white shadow";
  const inactiveClasses = "bg-gray-100 text-indigo-500 hover:bg-gray-200";

  return (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transaction For
        </label>
        <div className="flex rounded-lg p-1 bg-gray-100">
            <button
                type="button"
                onClick={() => onToggle('Supplier')}
                className={`${baseClasses} rounded-l-md ${selectedModel === 'Supplier' ? activeClasses : inactiveClasses}`}
            >
                Supplier
            </button>
            <button
                type="button"
                onClick={() => onToggle('Customer')}
                className={`${baseClasses} rounded-r-md ${selectedModel === 'Customer' ? activeClasses : inactiveClasses}`}
            >
                Customer
            </button>
        </div>
    </div>
  );
};

// Icon component for inputs
const FieldIcon = ({ children }) => (
  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
    {children}
  </div>
);

// Reusable FormField component
const FormField = ({ label, name, error, children }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      {children}
    </div>
    {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
  </div>
);

// Submit button with loading state
const SubmitButton = ({ isSubmitting, initialData }) => (
  <button
    type="submit"
    disabled={isSubmitting}
    className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
  >
    {isSubmitting ? (
      <>
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Saving...
      </>
    ) : (initialData ? 'Update Transaction' : 'Save Transaction')}
  </button>
);

// State-driven Toast component
const Toast = ({ message, show }) => {
  if (!show) return null;
  return (
    <div className="fixed top-5 right-5 z-50 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg animate-fade-in-down">
      {message}
    </div>
  );
};

// --- State Management with useReducer (Updated) ---

const getInitialState = (initialData) => {
  if (initialData) {
    return {
      ...initialData,
      date: new Date(initialData.date).toISOString().split('T')[0],
      party: initialData.party._id,
    };
  }
  // Default to a 'Supplier' transaction
  return {
    date: new Date().toISOString().split('T')[0],
    type: 'Purchase',
    mode: 'Cash',
    partyModel: 'Supplier',
    party: '',
    description: '',
    amount: '',
  };
};

// Reducer updated to handle the toggle action
const formReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PARTY_MODEL': {
      const newPartyModel = action.payload;
      return {
        ...state,
        partyModel: newPartyModel,
        // Set default type and reset party for the new context
        type: newPartyModel === 'Supplier' ? 'Purchase' : 'Sale',
        party: '',
      };
    }
    case 'SET_FIELD': {
      const { name, value } = action.payload;
      // The logic for auto-setting partyModel is now controlled by the toggle
      return { ...state, [name]: value };
    }
    case 'RESET':
      return getInitialState(action.payload);
    default:
      return state;
  }
};


// --- Main Form Component (Updated) ---

const AddTransactionForm = ({ suppliers, customers, onSuccess, initialData }) => {
  const [state, dispatch] = useReducer(formReducer, getInitialState(initialData));
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    dispatch({ type: 'RESET', payload: initialData });
  }, [initialData]);

  // These lists define the available options for the "Type" dropdown
  const supplierTransactionTypes = [
    { value: 'Purchase', label: 'Purchase' },
    { value: 'Payment Out', label: 'Payment Out' },
  ];
  const customerTransactionTypes = [
    { value: 'Sale', label: 'Sale' },
    { value: 'Payment In', label: 'Payment In' },
  ];
  
  // The correct list is chosen based on the state
  const transactionTypes = state.partyModel === 'Supplier' ? supplierTransactionTypes : customerTransactionTypes;
  
  // The party list is already reactive to state.partyModel
  const partyList = useMemo(() => {
    return state.partyModel === 'Supplier' ? suppliers : customers;
  }, [state.partyModel, suppliers, customers]);

  // --- Event Handlers ---
  
  const handlePartyModelToggle = (newModel) => {
    dispatch({ type: 'SET_PARTY_MODEL', payload: newModel });
  };

  const handleChange = (e) => {
    dispatch({
      type: 'SET_FIELD',
      payload: { name: e.target.name, value: e.target.value },
    });
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };
  
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
      onSuccess();
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation logic remains the same
    const newErrors = {};
    if (!state.date) newErrors.date = 'Date is required.';
    if (!state.type) newErrors.type = 'Type is required.';
    if (!state.party) newErrors.party = 'Please select a party.';
    if (!state.amount || parseFloat(state.amount) <= 0) newErrors.amount = 'Amount must be a positive number.';
    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateTransaction(initialData._id, state);
        showToast('Transaction updated successfully!');
      } else {
        await createTransaction(state);
        showToast('Transaction created successfully!');
      }
    } catch (error) {
      console.error('Failed to save transaction', error);
      setErrors({ form: error.response?.data?.message || 'An unexpected error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = (name) =>
    `w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm ${
      errors[name] ? 'border-red-400' : 'border-gray-300'
    }`;

  // --- Render ---

  return (
    <>
      <Toast message={toast.message} show={toast.show} />
      <form onSubmit={handleSubmit} className="space-y-6 p-1">
        
        <PartyToggle selectedModel={state.partyModel} onToggle={handlePartyModelToggle} />
        
        <hr/>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Type *" name="type" error={errors.type}>
            <FieldIcon>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
            </FieldIcon>
            <select name="type" value={state.type} onChange={handleChange} className={inputClasses('type')}>
              {transactionTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Date *" name="date" error={errors.date}>
             <FieldIcon>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </FieldIcon>
            <input type="date" name="date" value={state.date} onChange={handleChange} className={inputClasses('date')} />
          </FormField>
        </div>

        <FormField label="Party *" name="party" error={errors.party}>
          <FieldIcon>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </FieldIcon>
          <select name="party" value={state.party} onChange={handleChange} className={inputClasses('party')}>
            <option value="" disabled>Select a {state.partyModel.toLowerCase()}</option>
            {partyList.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} (Balance: ${p.balance.toLocaleString()})
              </option>
            ))}
          </select>
        </FormField>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Amount *" name="amount" error={errors.amount}>
            <FieldIcon>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>
            </FieldIcon>
            <input type="number" name="amount" value={state.amount} onChange={handleChange} step="0.01" min="0" className={inputClasses('amount')} placeholder="0.00" />
          </FormField>

          <FormField label="Payment Mode" name="mode" error={errors.mode}>
            <FieldIcon>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </FieldIcon>
            <select name="mode" value={state.mode} onChange={handleChange} className={inputClasses('mode')}>
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="Online Payment">Online Payment</option>
            </select>
          </FormField>
        </div>

        <FormField label="Description" name="description" error={errors.description}>
          <textarea name="description" value={state.description} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm" rows="3" placeholder="Add a note or details..." />
        </FormField>
        
        {errors.form && <p className="text-sm text-red-600 text-center">{errors.form}</p>}
        
        <div className="pt-4">
          <SubmitButton isSubmitting={isSubmitting} initialData={initialData} />
        </div>
      </form>
    </>
  );
};

export default AddTransactionForm;