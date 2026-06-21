import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "../context/I18nContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPrint } from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";

function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const [invoiceHtml, setInvoiceHtml] = useState("");

  // جلب الفاتورة
  const { data: sale, isLoading } = useQuery({
    queryKey: ["sale", id],
    queryFn: async () => {
      const response = await api.get(`/sales/${id}`);
      return response.data.data;
    },
  });

  // جلب HTML الفاتورة
  useEffect(() => {
    if (id) {
      api
        .get(`/sales/${id}/invoice`, {
          responseType: "text",
        })
        .then((response) => {
          setInvoiceHtml(response.data);
        })
        .catch((error) => {
          console.error("Error loading invoice:", error);
        });
    }
  }, [id]);
  
  // طباعة تلقائية للفاتورة مباشرة بعد تحميلها بنجاح إن كانت المعاملة قد تمت للتو
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("invoice")} #{sale?.invoice_number}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {sale?.created_at &&
                new Date(sale.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex space-x-3 rtl:space-x-reverse">
            <button
              onClick={() => navigate("/sales")}
              className="btn-secondary"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2 rtl:ml-2" />
              {t("home")}
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center space-x-2 rtl:space-x-reverse"
            >
              <span>
                <FontAwesomeIcon icon={faPrint} />
              </span>
              <span>{t("print")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="card p-0 overflow-hidden">
        <div
          className="invoice-preview bg-white dark:bg-gray-800 p-8"
          dangerouslySetInnerHTML={{ __html: invoiceHtml }}
        />
      </div>
    </div>
  );
}

export default Invoice;
