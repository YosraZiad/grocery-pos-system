import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useI18n } from "../context/I18nContext";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint, faRightFromBracket, faCircleNotch } from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import toast from "react-hot-toast";

function ZReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useI18n();
  const { logout } = useAuth();
  const [reportHtml, setReportHtml] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch Z-Report HTML view
  useEffect(() => {
    if (id && language) {
      setLoading(true);
      api
        .get(`/shifts/${id}/z-report?lang=${language}`, {
          responseType: "text",
        })
        .then((response) => {
          setReportHtml(response.data);
        })
        .catch((error) => {
          console.error("Error loading Z-Report HTML:", error);
          toast.error(
            language === "ar"
              ? "خطأ في تحميل بيانات تقرير الإغلاق."
              : "Error loading Z-Report data."
          );
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, language]);

  // Handle Auto-Print once HTML is loaded
  useEffect(() => {
    if (reportHtml && location.state?.autoPrint) {
      const timer = setTimeout(() => {
        window.print();
        // Clear state so manual refreshes don't print again
        navigate(location.pathname, { replace: true, state: {} });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [reportHtml, location.state, navigate, location.pathname]);

  const handlePrint = () => {
    window.print();
  };

  const handleExitAndLogout = async () => {
    try {
      await logout();
      toast.success(
        language === "ar"
          ? "تم تسجيل الخروج بنجاح وتأمين محطة البيع."
          : "Logged out successfully. Station secured."
      );
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-4xl text-primary-500" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          {language === "ar" ? "جاري تحميل تقرير الإغلاق Z..." : "Loading Z-Report details..."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700">
        <div className="flex flex-col space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {language === "ar" ? "تقرير إغلاق الوردية (Z-Report)" : "Shift Closing (Z-Report)"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {language === "ar" 
                ? "تم إقفال الوردية بنجاح. يرجى طباعة التقرير وتسجيل الخروج لتأمين المحطة." 
                : "Shift closed successfully. Print report and log out to secure the terminal."}
            </p>
          </div>
          
          <div className="flex justify-center space-x-3 rtl:space-x-reverse">
            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="btn btn-primary flex items-center space-x-2 rtl:space-x-reverse py-2 px-4 rounded-xl text-xs font-bold"
            >
              <FontAwesomeIcon icon={faPrint} />
              <span>{language === "ar" ? "طباعة التقرير" : "Print Report"}</span>
            </button>

            {/* Exit/Logout Button */}
            <button
              onClick={handleExitAndLogout}
              className="btn btn-danger flex items-center space-x-2 rtl:space-x-reverse py-2 px-4 rounded-xl text-xs font-bold"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span>{language === "ar" ? "خروج وتأمين" : "Exit & Secure"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Z-Report Layout Preview */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden z-report-preview-container">
        <div
          className="z-report-preview"
          dangerouslySetInnerHTML={{ __html: reportHtml }}
        />
      </div>
    </div>
  );
}

export default ZReport;
