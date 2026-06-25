import { useI18n } from "../context/I18nContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faMoneyBillWave,
  faBuildingColumns,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";

function PaymentMethod({ value, onChange, disabled = false }) {
  const { t } = useI18n();

  const paymentMethods = [
    { value: "cash", label: t("cash"), icon: faMoneyBillWave },
    { value: "card", label: t("card"), icon: faCreditCard },
    { value: "transfer", label: t("transfer"), icon: faBuildingColumns },
    { value: "hybrid", label: t("hybrid") || "مختلط (مقسم)", icon: faWallet },
  ];

  return (
    <div>
      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1.5">{t("paymentMethod")}</label>
      <div className="grid grid-cols-4 gap-2">
        {paymentMethods.map((method) => (
          <button
            key={method.value}
            type="button"
            onClick={() => !disabled && onChange(method.value)}
            disabled={disabled}
            className={`py-2 px-1 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 ${
              value === method.value
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30"
                : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-800"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="text-lg mb-1">
              <FontAwesomeIcon icon={method.icon} />
            </div>
            <div
              className={`text-[10px] font-extrabold truncate w-full text-center ${
                value === method.value
                  ? "text-primary-700 dark:text-primary-300"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {method.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PaymentMethod;
