import { useState } from "react";

interface BiddersProps {
  jobData: any;
}

const Bidders = ({ jobData }: BiddersProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const assignedServiceProviders = jobData?.assignedServiceProviders || [];

  // Calculate pagination
  const totalPages = Math.ceil(assignedServiceProviders.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentBidders = assignedServiceProviders.slice(startIndex, endIndex);

  const formatuserType = (userType: string) => {
    return userType?.replace(/([A-Z])/g, ' $1').trim() || 'N/A';
  };

  return (
    <div className="pt-8">
      <div className="flex h-screen bg-white">
        <div className="flex-1 flex flex-col transition-all duration-300 relative">
          {/* Table Section */}
          <div className="w-full max-w-screen-xl mx-auto bg-white border border-gray-200 rounded-xl shadow-lg p-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Bidders</h2>

            <div className="overflow-x-auto">
              <table className="w-full table-auto text-base border border-gray-300">
                <thead className="bg-gray-100 text-gray-700">
                  <tr className="border-b border-gray-300">
                    <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                      User Type
                    </th>
                    <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left font-semibold whitespace-nowrap">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentBidders.length > 0 ? (
                    currentBidders.map((bidder: any, index: number) => (
                      <tr
                        key={bidder.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-gray-800 whitespace-nowrap">
                          {bidder.id}
                        </td>
                        <td className="px-6 py-4 text-gray-800 whitespace-nowrap">
                          {bidder.organizationName || 
                           `${bidder.firstName || ''} ${bidder.lastName || ''}`.trim() || 
                           'N/A'}
                        </td>
                        <td className="px-6 py-4 text-gray-800 whitespace-nowrap">
                          {formatuserType(bidder.userType)}
                        </td>
                        <td className="px-6 py-4 text-gray-800 whitespace-nowrap">
                          {bidder.email}
                        </td>
                        <td className="px-6 py-4 text-gray-800 whitespace-nowrap">
                          {bidder.phoneNumber}
                        </td>
                        <td className="px-6 py-4 text-gray-800 whitespace-nowrap">
                          {[bidder.county, bidder.subCounty, bidder.estate]
                            .filter(Boolean)
                            .join(', ') || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bidder.adminApproved 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {bidder.adminApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No bidders assigned to this job
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {assignedServiceProviders.length > 0 && (
              <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border rounded px-3 py-1"
                  >
                    {[5, 10, 20, 30].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded disabled:opacity-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded disabled:opacity-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bidders;
