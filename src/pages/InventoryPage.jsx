import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';

const InventoryPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { shop } = useSelector((state) => state.shop);
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newExpense, setNewExpense] = useState({
    itemName: '',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { value: 'tool', label: 'Tool' },
    { value: 'material', label: 'Material' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'rent', label: 'Rent' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'other', label: 'Other' }
  ];

  // Helper function to safely convert Firebase Timestamp
  const convertTimestampToString = (timestamp) => {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    return null;
  };

  // Load expenses
  useEffect(() => {
    const loadExpenses = async () => {
      if (!user?.uid || !shop) return;

      try {
        setIsLoading(true);
        const expensesRef = collection(db, 'shops', user.uid, 'expenses');
        const expensesQuery = query(expensesRef, orderBy('date', 'desc'));
        const snapshot = await getDocs(expensesQuery);
        
        const expensesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: convertTimestampToString(data.createdAt)
          };
        });
        
        setExpenses(expensesData);
      } catch (error) {
        console.error('Error loading expenses:', error);
        setError('Failed to load expenses');
      } finally {
        setIsLoading(false);
      }
    };

    loadExpenses();
  }, [user?.uid, shop]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!newExpense.itemName.trim()) {
      setError('Item name is required');
      return false;
    }
    if (!newExpense.category) {
      setError('Category is required');
      return false;
    }
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (!newExpense.date) {
      setError('Date is required');
      return false;
    }
    return true;
  };

  const handleAddExpense = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError('');

      const expenseData = {
        itemName: newExpense.itemName.trim(),
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date,
        notes: newExpense.notes.trim(),
        createdAt: new Date().toISOString()
      };

      const expensesRef = collection(db, 'shops', user.uid, 'expenses');
      const docRef = await addDoc(expensesRef, expenseData);

      const newExpenseWithId = {
        id: docRef.id,
        ...expenseData
      };

      setExpenses([newExpenseWithId, ...expenses]);
      setNewExpense({
        itemName: '',
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setIsAddingExpense(false);
      setSuccessMessage('Expense added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Error adding expense:', error);
      setError('Failed to add expense. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateExpense = async (expenseId, field, value) => {
    try {
      const updatedExpenses = expenses.map(expense => 
        expense.id === expenseId ? { ...expense, [field]: value } : expense
      );
      setExpenses(updatedExpenses);

      const expenseRef = doc(db, 'shops', user.uid, 'expenses', expenseId);
      await updateDoc(expenseRef, {
        [field]: value,
        updatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating expense:', error);
      setError('Failed to update expense. Please try again.');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const expenseRef = doc(db, 'shops', user.uid, 'expenses', expenseId);
      await deleteDoc(expenseRef);

      setExpenses(expenses.filter(expense => expense.id !== expenseId));
      setSuccessMessage('Expense deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense. Please try again.');
    }
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate statistics
  const calculateStats = () => {
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthlyExpenses = filteredExpenses.filter(expense => 
      new Date(expense.date) >= thisMonth
    ).reduce((sum, expense) => sum + expense.amount, 0);

    const categoryTotals = categories.map(category => ({
      ...category,
      total: filteredExpenses
        .filter(expense => expense.category === category.value)
        .reduce((sum, expense) => sum + expense.amount, 0)
    })).filter(category => category.total > 0);

    return { totalExpenses, monthlyExpenses, categoryTotals };
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      tool: 'bg-blue-100 text-blue-800 border-blue-200',
      material: 'bg-green-100 text-green-800 border-green-200',
      equipment: 'bg-purple-100 text-purple-800 border-purple-200',
      maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
      rent: 'bg-red-100 text-red-800 border-red-200',
      utilities: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[category] || colors.other;
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-lightBlue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-spin mx-auto mb-4 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600 text-lg">Loading shop inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent">
              Shop Inventory
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">Track shop expenses and general inventory</p>
        </div>

        <button
          onClick={() => setIsAddingExpense(!isAddingExpense)}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Expense
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 p-4 rounded-xl">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 font-semibold">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 p-4 rounded-xl">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalExpenses)}</p>
              <p className="text-sm text-gray-600">Total Expenses</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-lightBlue-50 p-6 rounded-2xl border border-emerald-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-lightBlue-500 rounded-xl flex items-center justify-center text-white mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyExpenses)}</p>
              <p className="text-sm text-gray-600">This Month</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cream-50 to-orange-50 p-6 rounded-2xl border border-cream-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-cream-500 to-orange-500 rounded-xl flex items-center justify-center text-white mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Form */}
      {isAddingExpense && (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-purple-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Expense</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                name="itemName"
                value={newExpense.itemName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
                placeholder="e.g., Sewing Machine, Thread, Rent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={newExpense.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount (₦) *
              </label>
              <input
                type="number"
                name="amount"
                value={newExpense.amount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={newExpense.date}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={newExpense.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 resize-none"
              placeholder="Additional notes about this expense"
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={() => {
                setIsAddingExpense(false);
                setNewExpense({
                  itemName: '',
                  category: '',
                  amount: '',
                  date: new Date().toISOString().split('T')[0],
                  notes: ''
                });
                setError('');
              }}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddExpense}
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-purple-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-white border-2 border-purple-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
                placeholder="Search expenses by name or notes..."
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="sm:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-purple-200 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 px-4">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {expenses.length === 0 ? 'No Expenses Yet' : 'No Expenses Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {expenses.length === 0 
                ? "Start tracking your shop expenses by adding your first expense."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {expenses.length === 0 && (
              <button
                onClick={() => setIsAddingExpense(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
              >
                Add Your First Expense
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className="p-6 hover:bg-purple-50 transition-colors duration-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  {/* Expense Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{expense.itemName}</h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(expense.category)}`}>
                        {categories.find(c => c.value === expense.category)?.label || expense.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Date: {formatDate(expense.date)}</p>
                    {expense.notes && (
                      <p className="text-sm text-gray-500">{expense.notes}</p>
                    )}
                  </div>

                  {/* Amount and Actions */}
                  <div className="flex items-center justify-between lg:justify-end space-x-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {stats.categoryTotals.length > 0 && (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-purple-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Expense Breakdown by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.categoryTotals.map((category) => (
              <div key={category.value} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(category.value)}`}>
                    {category.label}
                  </span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(category.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;