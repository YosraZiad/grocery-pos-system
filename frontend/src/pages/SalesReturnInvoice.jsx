import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "../context/I18nContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPrint } from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";

function SalesReturnInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const [invoiceHtml, setInvoiceHtml] = useState("");

  // جلب الفاتورة المرتجعة
  const { data: salesReturn, isLoading } = useQuery({
    queryKey: ["salesReturn", id],
    queryFn: async () => {
      const response = await api.get(`/sales-returns/${id}`);
      return response.data.data;
    },
  });

  // جلب HTML الفاتورة
  useEffect(() => {
    if (id) {
      api
        .get(`/sales-returns/${id}/invoice`, {
          responseType: "text",
        })
        .then((response) => {
          setInvoiceHtml(response.data);
        })
        .catch((error) => {
          console.error("Error loading sales return invoice:", error);
        });
    }
  }, [id]);
  
  // طباعة تلقائية للفاتورة مباشرة بعد تحميلها بنجاح
  useEffect(() => {
    if (invoiceHtml && location.state?.autoPrint) {
      const timer = setTimeout(() => {
        window.print();
        // مسح الحالة لتفادي إطلاق الطباعة مجدداً عند عمل Refresh يدوي
        navigate(location.pathname, { replace: true, state: {} });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [invoiceHtml, location.state, navigate, location.pathname]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t("loading") || "جاري التحميل..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              فاتورة مرتجع مبيعات #{salesReturn?.return_number}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {salesReturn?.created_at &&
                new Date(salesReturn.created_at).toLocaleDateString("ar-SA")}
            </p>
          </div>
          <div className="flex space-x-3 rtl:space-x-reverse">
            <button
              onClick={() => navigate("/sales-returns")}
              className="btn btn-secondary py-2 px-4"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2 rtl:ml-2" />
              مرتجع المبيعات
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-primary flex items-center space-x-2 rtl:space-x-reverse py-2 px-4"
            >
              <span>
                <FontAwesomeIcon icon={faPrint} />
              </span>
              <span>طباعة الفاتورة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="card p-0 overflow-hidden bg-white rounded-2xl border border-gray-150 dark:border-gray-700">
        <div
          className="invoice-preview bg-white p-8"
          dangerouslySetInnerHTML={{ __html: invoiceHtml }}
        />
      </div>
    </div>
  );
}

export default SalesReturnInvoice;
