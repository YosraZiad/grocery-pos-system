import { useI18n } from "../context/I18nContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

function SearchBar({ value, onChange, placeholder }) {
  const { t } = useI18n();

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="h-5 w-5 text-gray-400"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t("searchPlaceholder")}
        className="input pl-10 rtl:pl-0 rtl:pr-10"
      />
    </div>
  );
}

export default SearchBar;
