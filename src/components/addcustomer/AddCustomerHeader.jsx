import { useNavigate } from 'react-router-dom';

const AddCustomerHeader = ({ showOrderSection }) => {
  const navigate = useNavigate();

  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-lightBlue-500 rounded-3xl flex items-center justify-center shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
      </div>
      
      <h1 className="text-4xl font-bold mb-4">
        <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent">
          Add New Customer
        </span>
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        Add a new customer with their measurements and optionally create their first order.
      </p>
    </div>
  );
};

export default AddCustomerHeader;