interface LeadTimeProps {
  orderData: {
    createdAt?: string;
    deliveryConfirmedAt?: string;
  };
}

const LeadTime = ({ orderData }: LeadTimeProps) => {

  const { createdAt: startDate, deliveryConfirmedAt: deliveryDate } = orderData;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateDuration = () => {
    if (startDate && deliveryDate) {
      const start = new Date(startDate);
      const end = new Date(deliveryDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return 0;
      }
      
      const timeDiff = end.getTime() - start.getTime();
      const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      return dayDiff >= 0 ? dayDiff : 0;
    }
    return 0;
  };
  
  const duration = calculateDuration();

  return (
    <>
      <div className="mt-10 min-h-screen flex items-start justify-center bg-gray-100 py-20 px-6">
        <div className="w-full max-w-6xl bg-white shadow-2xl rounded-2xl p-10 space-y-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Delivery Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Start Date
              </label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-gray-800">{formatDate(startDate)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Delivery Date
              </label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                 <p className="text-gray-800">{formatDate(deliveryDate)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">Estimated Duration:</p>
            <p className="text-xl font-bold text-blue-900 mt-1">
              {duration} {duration === 1 ? "day" : "days"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LeadTime;