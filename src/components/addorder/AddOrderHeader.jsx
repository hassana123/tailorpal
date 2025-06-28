import { useNavigate } from 'react-router-dom';

const AddOrderHeader = ({ selectedCustomer }) => {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-pink-500 to-lightBlue-500 rounded-3xl flex items-center justify-center shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      </div>
      
      <h1 className="text-4xl font-bold mb-4">
        <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-lightBlue-600 bg-clip-text text-transparent">
          {selectedCustomer ? `Add Order for ${selectedCustomer.fullName}` : 'Add New Order'}
        </span>
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        {selectedCustomer 
          ? `Create a new order for ${selectedCustomer.fullName}.`
          : 'Create a new order for an existing customer or add a new customer with their first order.'
        }
      </p>
    </div>
  );
};

export default AddOrderHeader;