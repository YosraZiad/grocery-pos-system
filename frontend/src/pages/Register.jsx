import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    tenant_id: 1, // افتراضي - سيتم تحسينه لاحقًا
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t, toggleLanguage, language } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrors({});
    setLoading(true);

    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.password_confirmation,
      formData.tenant_id
    );

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || t('error'));
      if (result.errors) {
        setErrors(result.errors);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="absolute top-4 right-4 flex space-x-2 rtl:space-x-reverse">
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md transition-all duration-200"
          title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
        >
          {language === 'en' ? '🇸🇦' : '🇬🇧'}
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md transition-all duration-200"
          title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <div className="max-w-md w-full space-y-8">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span className="text-white text-4xl">🛒</span>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            {t('register')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('or')}{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors duration-200"
            >
              {t('login')}
            </Link>
          </p>
        </div>

        {/* Register Form */}
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
                <label htmlFor="name" className="label">
                  {t('name')} *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                  className="input"
                  placeholder={t('fullName')}
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name[0]}</p>
              )}
            </div>

            <div>
                <label htmlFor="email" className="label">
                  {t('email')} *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                  className="input"
                  placeholder={t('email')}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email[0]}</p>
              )}
            </div>

            <div>
                <label htmlFor="password" className="label">
                  {t('password')} *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                  className="input"
                  placeholder={t('passwordMin')}
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password[0]}</p>
              )}
            </div>

            <div>
                <label htmlFor="password_confirmation" className="label">
                  {t('confirmPassword')} *
              </label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                required
                  className="input"
                  placeholder={t('confirmPasswordPlaceholder')}
                value={formData.password_confirmation}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
                className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? t('processing') : t('registerButton')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
