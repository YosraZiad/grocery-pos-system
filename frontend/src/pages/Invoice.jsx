import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoiceHtml, setInvoiceHtml] = useState('');

  // جلب الفاتورة
  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      const response = await api.get(`/sales/${id}`);
      return response.data.data;
    },
  });

  // جلب HTML الفاتورة
  useEffect(() => {
    if (id) {
      api.get(`/sales/${id}/invoice`, {
        responseType: 'text',
      })
        .then((response) => {
          setInvoiceHtml(response.data);
        })
        .catch((error) => {
          console.error('Error loading invoice:', error);
        });
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="text-center py-8">جاري التحميل...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            فاتورة #{sale?.invoice_number}
          </h2>
          <div className="space-x-2">
            <button
              onClick={() => navigate('/sales')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              رجوع
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              🖨️ طباعة
            </button>
          </div>
        </div>

        {/* عرض HTML الفاتورة */}
        <div 
          className="invoice-preview"
          dangerouslySetInnerHTML={{ __html: invoiceHtml }}
        />
      </div>
    </div>
  );
}

export default Invoice;
