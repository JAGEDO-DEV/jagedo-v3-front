interface CustomerDetailsProps {
  jobData: any;
}

export default function CustomerDetails({ jobData }: CustomerDetailsProps) {
  const customerData = jobData?.customer;

  if (!customerData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white text-center p-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-700">Customer Not Found</h2>
          <p className="text-gray-500 mt-2">The details for this customer could not be loaded.</p>
        </div>
      </div>
    );
  }

  const isOrganization = customerData.accountType === 'ORGANIZATION';
  const displayName = isOrganization 
    ? customerData.organizationName 
    : `${customerData.firstName} ${customerData.lastName}`;
  const contactPerson = `${customerData.contactfirstName || ''} ${customerData.contactlastName || ''}`.trim();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white shadow-xl rounded-2xl md:rounded-3xl p-6 md:p-10 flex flex-col items-center text-center border border-gray-200">
        
        <img
          src={customerData.userProfile?.profileImage || '/profile.jpg'}
          alt="Customer Avatar"
          className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover shadow-lg border-4 border-green-500 mb-6"
        />

        <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-1">
          {displayName}
        </h2>

        <p className="text-lg md:text-xl text-gray-600 capitalize">
          {customerData.accountType.toLowerCase()}
        </p>

        {isOrganization && contactPerson && (
          <p className="text-base md:text-lg text-gray-600 mt-1 mb-6">
             Contact: {contactPerson}
          </p>
        )}
        
        <div className="w-full space-y-4 text-left mt-6 pt-6 border-t border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Phone</h3>
            <p className="text-base md:text-lg text-gray-800">{customerData.phoneNumber}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Email</h3>
            <p className="text-base md:text-lg text-gray-800 break-words">{customerData.email}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Location</h3>
            <p className="text-base md:text-lg text-gray-800">
              {[customerData.country, customerData.county, customerData.subCounty, customerData.estate]
                .filter(Boolean)
                .join(', ') || 'N/A'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500">Admin Approved</h3>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              customerData.adminApproved 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {customerData.adminApproved ? 'Approved' : 'Not Approved'}
            </span>
          </div>
          {customerData.zohoId && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500">Zoho ID</h3>
              <p className="text-base md:text-lg text-gray-800 font-mono">{customerData.zohoId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
