import { useI18n } from '../context/I18nContext';

function SearchBar({ value, onChange, placeholder }) {
  const { t } = useI18n();
  
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('searchPlaceholder')}
        className="input pl-10 rtl:pl-0 rtl:pr-10"
      />
    </div>
  );
}

export default SearchBar;
