// src/pages/DashboardPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { getSuppliers, getCustomers, getAllTransactions, getTransactionSummaries } from '../services/apiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const DashboardPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [chartToggle, setChartToggle] = useState('customers'); // 'customers' or 'suppliers'
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, message: '' });
  const [useSummaryEndpoint, setUseSummaryEndpoint] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate date range based on selected period
  const getDateRange = (period = selectedPeriod) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          startDate: today,
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      case 'this-week':
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay();
        const diff = (day === 0 ? 6 : day - 1); // Start on Monday
        startOfWeek.setDate(today.getDate() - diff);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return {
          startDate: startOfWeek,
          endDate: endOfWeek
        };
      case 'this-year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return {
          startDate: startOfYear,
          endDate: endOfYear
        };
      case 'all-time':
      default:
        return {
          startDate: new Date(0), // Very old date
          endDate: new Date() // Current date
        };
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingProgress({ current: 0, total: 3, message: 'Loading suppliers and customers...' });
      
      // Fetch suppliers and customers first
      const [suppliersRes, customersRes] = await Promise.all([
        getSuppliers(),
        getCustomers(),
      ]);
      setSuppliers(suppliersRes.data);
      setCustomers(customersRes.data);
      
      setLoadingProgress({ current: 1, total: 3, message: 'Loading all transactions...' });
      
      // Fetch all transactions with pagination
      const transactionsRes = await getAllTransactions();
      // Sort transactions by date descending for recent transactions
      setTransactions((transactionsRes.data.items || []).sort((a, b) => new Date(b.date) - new Date(a.date)));
      
      setLoadingProgress({ current: 2, total: 3, message: 'Finalizing...' });
      setError(null);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingProgress({ current: 0, total: 0, message: '' });
    }
  };

  const dateRange = useMemo(() => getDateRange(), [selectedPeriod]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
    });
  }, [transactions, dateRange]);

  // Helper to sum by type
  const sumByType = (type, transactionsList = filteredTransactions) => {
    return transactionsList
      .filter(t => t.type === type)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  };

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const totalCustomers = customers.length;
    const totalSales = sumByType('Sale');
    const totalPurchase = sumByType('Purchase');
    const totalPaymentIn = sumByType('Payment In');
    const totalPaymentOut = sumByType('Payment Out');

    return {
      totalSales,
      totalPurchase,
      totalCustomers,
      totalSuppliers,
      totalPaymentIn,
      totalPaymentOut,
    };
  }, [filteredTransactions, suppliers, customers]);

  // Calculate chart data
  const chartData = useMemo(() => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
    
    // Sales data for the week (dynamic)
    const weekRange = getDateRange('this-week');
    const filteredWeekTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= weekRange.startDate && transactionDate <= weekRange.endDate;
    });
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const salesByDay = Array(7).fill(0);
    const startTime = weekRange.startDate.getTime();
    filteredWeekTransactions
      .filter(t => t.type === 'Sale')
      .forEach(t => {
        const transactionDate = new Date(t.date);
        const dayIndex = Math.floor((transactionDate.getTime() - startTime) / (24 * 60 * 60 * 1000));
        if (dayIndex >= 0 && dayIndex < 7) {
          salesByDay[dayIndex] += t.amount || 0;
        }
      });
    const salesData = days.map((day, i) => ({ day, sales: salesByDay[i] }));

    // Top 5 customers or suppliers
    const getTopParties = () => {
      if (chartToggle === 'customers') {
        const salesMap = new Map();
        filteredTransactions
          .filter(t => t.type === 'Sale')
          .forEach(t => {
            const id = t.party?._id;
            if (id) {
              salesMap.set(id, (salesMap.get(id) || 0) + (t.amount || 0));
            }
          });
        return customers
          .map(c => ({ name: c.name, value: salesMap.get(c._id) || 0 }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
          .map((item, index) => ({ ...item, color: COLORS[index % COLORS.length] }));
      } else {
        const purchasesMap = new Map();
        filteredTransactions
          .filter(t => t.type === 'Purchase')
          .forEach(t => {
            const id = t.party?._id;
            if (id) {
              purchasesMap.set(id, (purchasesMap.get(id) || 0) + (t.amount || 0));
            }
          });
        return suppliers
          .map(s => ({ name: s.name, value: purchasesMap.get(s._id) || 0 }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
          .map((item, index) => ({ ...item, color: COLORS[index % COLORS.length] }));
      }
    };

    const topParties = getTopParties();

    return { salesData, topParties };
  }, [filteredTransactions, chartToggle, suppliers, customers, transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500 mb-4">{loadingProgress.message}</div>
          {loadingProgress.total > 0 && (
            <div className="w-64 bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
              ></div>
            </div>
          )}
          <div className="text-sm text-gray-400">
            {loadingProgress.total > 0 && `${loadingProgress.current}/${loadingProgress.total}`}
          </div>
        </div>
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header with Date Input and Small Cards */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Business performance overview</p>
            {transactions.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {transactions.length.toLocaleString()} transactions loaded
              </p>
            )}
          </div>
          <div className="w-full lg:w-auto flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 w-full">
              {/* Small Customer Card */}
              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Customers</p>
                    <p className="text-lg font-bold text-blue-600">{kpis.totalCustomers}</p>
                  </div>
                </div>
              </div>

              {/* Small Supplier Card */}
              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Suppliers</p>
                    <p className="text-lg font-bold text-orange-600">{kpis.totalSuppliers}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full">
              {/* Time Period Dropdown */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full sm:w-44 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="all-time">All Time</option>
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-year">This Year</option>
              </select>

              {/* Performance Toggle */}
              <button
                onClick={() => setUseSummaryEndpoint(!useSummaryEndpoint)}
                className={`w-full sm:w-auto text-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  useSummaryEndpoint 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={useSummaryEndpoint ? 'Using fast summary mode' : 'Using full data mode'}
              >
                {useSummaryEndpoint ? 'Fast Mode' : 'Full Data'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Cards - Single Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Sales */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Sales</p>
              <p className="text-3xl font-bold text-green-600">${kpis.totalSales.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Purchase */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Purchase</p>
              <p className="text-3xl font-bold text-red-600">${kpis.totalPurchase.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Payment In */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Payment In</p>
              <p className="text-3xl font-bold text-purple-600">${kpis.totalPaymentIn.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Payment Out */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Payment Out</p>
              <p className="text-3xl font-bold text-pink-600">${kpis.totalPaymentOut.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-full">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart - Sales in a week */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Line Chart of Sales in a week</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Top 5 customers/suppliers */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Top 5 {chartToggle === 'customers' ? 'Customers by Sales' : 'Suppliers by Purchases'}
            </h3>
            <button
              onClick={() => setChartToggle(chartToggle === 'customers' ? 'suppliers' : 'customers')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Toggle
            </button>
          </div>
          <div className="h-80">
            {chartData.topParties.length === 0 || chartData.topParties.every(p => p.value === 0) ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.topParties}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.topParties.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [
                      `$${value.toLocaleString()}`, 
                      chartToggle === 'customers' ? 'Sales' : 'Purchases'
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          
          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Party Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.slice(0, 5).map((transaction) => (
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
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {transaction.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;