// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { getSuppliers, getCustomers, getTransactions } from '../services/apiService';

const DashboardPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suppliersRes, customersRes, transactionsRes] = await Promise.all([
        getSuppliers(),
        getCustomers(),
        getTransactions({ page: 1, limit: 5 }), // Get recent 5 transactions
      ]);
      setSuppliers(suppliersRes.data);
      setCustomers(customersRes.data);
      setTransactions(transactionsRes.data.items || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate KPIs
  const calculateKPIs = () => {
    const totalSuppliers = suppliers.length;
    const totalCustomers = customers.length;
    const transactionsThisMonth = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    }).length;
    
    const outstandingBalances = suppliers.reduce((sum, s) => sum + Math.abs(s.balance), 0) +
                               customers.reduce((sum, c) => sum + Math.abs(c.balance), 0);

    return {
      totalSuppliers,
      totalCustomers,
      transactionsThisMonth,
      outstandingBalances,
    };
  };

  // Calculate chart data
  const calculateChartData = () => {
    // Mock data for charts - in a real app, you'd get this from your backend
    const incomeVsExpenses = [
      { month: 'Jan', income: 12000, expenses: 8000 },
      { month: 'Feb', income: 15000, expenses: 9000 },
      { month: 'Mar', income: 18000, expenses: 11000 },
      { month: 'Apr', income: 14000, expenses: 10000 },
      { month: 'May', income: 16000, expenses: 12000 },
      { month: 'Jun', income: 19000, expenses: 13000 },
      { month: 'Jul', income: 17000, expenses: 11000 },
      { month: 'Aug', income: 20000, expenses: 14000 },
      { month: 'Sep', income: 16000, expenses: 12000 },
      { month: 'Oct', income: 18000, expenses: 13000 },
      { month: 'Nov', income: 22000, expenses: 15000 },
      { month: 'Dec', income: 25000, expenses: 16000 },
    ];

    const partySplit = {
      suppliers: suppliers.length,
      customers: customers.length,
    };

    const monthlyVolume = [
      { month: 'Jan', volume: 45 },
      { month: 'Feb', volume: 52 },
      { month: 'Mar', volume: 48 },
      { month: 'Apr', volume: 61 },
      { month: 'May', volume: 55 },
      { month: 'Jun', volume: 78 },
    ];

    return { incomeVsExpenses, partySplit, monthlyVolume };
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

  const kpis = calculateKPIs();
  const chartData = calculateChartData();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Performance Overview</h1>
        <p className="text-gray-600">Analyze your financial health with interactive charts and key performance indicators.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.totalSuppliers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Transactions This Month</p>
              <p className="text-2xl font-bold text-gray-900">{kpis.transactionsThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Outstanding Balances</p>
              <p className="text-2xl font-bold text-gray-900">${kpis.outstandingBalances.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Income vs Expenses Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Income vs. Expenses</h3>
            <div className="flex items-center text-green-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm font-medium">+15%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">Last 12 Months</p>
          
          {/* Simple chart representation */}
          <div className="space-y-3">
            {chartData.incomeVsExpenses.slice(-6).map((item, index) => (
              <div key={index} className="flex items-center">
                <span className="w-12 text-xs text-gray-500">{item.month}</span>
                <div className="flex-1 ml-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${(item.income / 25000) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">${item.income.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-pink-400 h-2 rounded-full" 
                        style={{ width: `${(item.expenses / 25000) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">${item.expenses.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center mt-4 space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Income</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-pink-400 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Expenses</span>
            </div>
          </div>
        </div>

        {/* Party Split Donut Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Transactions - Supplier vs. Customer</h3>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray={`${(chartData.partySplit.suppliers / (chartData.partySplit.suppliers + chartData.partySplit.customers)) * 100}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {chartData.partySplit.suppliers > 0 ? Math.round((chartData.partySplit.suppliers / (chartData.partySplit.suppliers + chartData.partySplit.customers)) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-500">Suppliers</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center mt-4 space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Suppliers</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-pink-400 rounded-full mr-2"></div>
              <span className="text-xs text-gray-600">Customers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Transaction Volume */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Transaction Volume</h3>
          <div className="flex items-center text-green-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-sm font-medium">+10%</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-6">Last 6 Months</p>
        
        <div className="flex items-end justify-between h-32">
          {chartData.monthlyVolume.map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <div 
                className="bg-red-500 rounded-t w-8 mb-2 transition-all duration-300 hover:bg-red-600"
                style={{ height: `${(item.volume / 80) * 100}%` }}
                title={`${item.month}: ${item.volume} transactions`}
              ></div>
              <span className="text-xs text-gray-500">{item.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Amount
                 </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.party?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.partyModel}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'Purchase' ? 'bg-blue-100 text-blue-800' :
                      transaction.type === 'Sale' ? 'bg-green-100 text-green-800' :
                      transaction.type === 'Payment In' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                     ${transaction.amount.toLocaleString()}
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent transactions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;