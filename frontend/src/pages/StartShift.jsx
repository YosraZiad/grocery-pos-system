import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDoorOpen,
  faLaptop,
  faUser,
  faClock,
  faMoneyBillWave,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

// Web Audio API Cash Register Sound Generator
const playChachingSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First high coin ring
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc1.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.12);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Second delayed coin ring
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987, ctx.currentTime + 0.06); // B5 note
    osc2.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.22);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    // Mechanical drawer "clunk" (using square wave with lowpass filter)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc3.type = "triangle";
    osc3.frequency.setValueAtTime(120, ctx.currentTime);
    osc3.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
    
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    
    gain3.gain.setValueAtTime(0.4, ctx.currentTime);
    gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    
    osc3.connect(filter);
    filter.connect(gain3);
    gain3.connect(ctx.destination);
    
    osc1.start();
    osc1.stop(ctx.currentTime + 0.2);
    
    osc2.start(ctx.currentTime + 0.06);
    osc2.stop(ctx.currentTime + 0.3);
    
    osc3.start();
    osc3.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.warn("Audio synthesis block or not supported:", e);
  }
};

export default function StartShift() {
  const { user } = useAuth();
  const { t, language } = useI18n();
  const navigate = useNavigate();

  const isAdmin = user?.roles?.some((role) => role.name === "admin");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [openingFloat, setOpeningFloat] = useState("");
  const [deviceNumber, setDeviceNumber] = useState(
    localStorage.getItem("device_number") || ""
  );
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [drawerOpenAnimation, setDrawerOpenAnimation] = useState(false);

  const { data: usersResponse } = useQuery({
    queryKey: ["users-list-for-shift-start"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data;
    },
    enabled: !!isAdmin,
  });

  const users = usersResponse?.data || [];

  // Live clock updating
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isAdmin && !selectedUserId) {
      toast.error(
        language === "en" ? "Please select a cashier" : "الرجاء اختيار الموظف/الكاشير"
      );
      return;
    }

    if (!openingFloat || isNaN(openingFloat) || Number(openingFloat) < 0) {
      toast.error(
        language === "en"
          ? "Please enter a valid trust amount"
          : "الرجاء إدخال قيمة عهدة صالحة"
      );
      return;
    }

    if (!deviceNumber.trim()) {
      toast.error(
        language === "en"
          ? "Please enter a device/register number"
          : "الرجاء إدخال رقم الجهاز أو الكاشير"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/shifts/start", {
        user_id: isAdmin ? Number(selectedUserId) : user.id,
        opening_float: Number(openingFloat),
        device_number: deviceNumber.trim(),
      });

      // Save device number in local storage
      localStorage.setItem("device_number", deviceNumber.trim());

      // Trigger cash drawer kick sound effect
      playChachingSound();

      // Trigger drawer open sliding visual animation
      setDrawerOpenAnimation(true);

      toast.success(
        language === "en" ? "Shift opened successfully!" : "تم فتح الوردية بنجاح!"
      );

      // Wait 2 seconds for sound and visual animation to display, then redirect
      setTimeout(() => {
        setDrawerOpenAnimation(false);
        navigate("/sales");
      }, 2000);

    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        (language === "en" ? "Failed to open shift." : "فشل فتح الوردية.");
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-full flex items-center justify-center text-4xl animate-pulse">
            ⚠️
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-950 dark:text-white">
              {language === "en" ? "Shift Start Restricted" : "بدء الوردية مقيد"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {language === "en"
                ? "Cashiers cannot start shifts themselves. Please ask an administrator to open your shift, assign your register, and set your opening float."
                : "لا يمكنك بدء وردية بنفسك. يجب على مدير النظام فتح الوردية وتحديد الجهاز والعهدة الافتتاحية لك أولاً."}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-start border border-gray-100 dark:border-gray-700 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">{language === "en" ? "Your Username" : "اسم المستخدم:"}</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">{language === "en" ? "Your Email" : "البريد الإلكتروني:"}</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/sales")}
            className="w-full btn btn-primary min-h-12"
          >
            {language === "en" ? "Go to POS Dashboard" : "الذهاب للوحة البيع"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      {/* Drawer Kick Animation Overlay */}
      {drawerOpenAnimation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center transition-all duration-300">
          <div className="space-y-6 text-center animate-bounce">
            <div className="mx-auto w-32 h-20 bg-gradient-to-b from-gray-700 to-gray-800 border-t-8 border-gray-600 rounded-b-xl shadow-2xl relative overflow-hidden flex flex-col justify-end pb-2">
              {/* Sliding metallic drawer */}
              <div className="absolute inset-x-2 top-0 h-10 bg-gradient-to-b from-amber-400 to-yellow-600 rounded-b shadow-inner animate-slide-out flex items-center justify-around px-2">
                <span className="w-2 h-2 rounded-full bg-yellow-300 shadow"></span>
                <span className="w-4 h-1.5 rounded-sm bg-green-500 shadow"></span>
                <span className="w-2 h-2 rounded-full bg-yellow-300 shadow"></span>
              </div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Drawer Open
              </div>
            </div>
            <h3 className="text-xl font-bold text-white">
              {language === "en"
                ? "Opening Cash Drawer..."
                : "جاري فتح درج الكاشير..."}
            </h3>
            <p className="text-sm text-gray-400">
              {language === "en" ? "Opening Float Confirmed" : "تم تأكيد العهدة الافتتاحية"}
            </p>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-6 text-white text-center">
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-2xl mb-3">
            <FontAwesomeIcon icon={faDoorOpen} />
          </div>
          <h2 className="text-2xl font-bold">
            {language === "en" ? "Open New Shift" : "بدء وردية كاشير جديدة"}
          </h2>
          <p className="text-xs text-white/80 mt-1">
            {language === "en"
              ? "Declare your trust opening cash float to continue"
              : "الرجاء التصريح بعهدتك الافتتاحية للبدء بالمبيعات"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Simple displays */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2.5 rtl:space-x-reverse text-gray-700 dark:text-gray-300">
              <FontAwesomeIcon icon={faUser} className="text-primary-500" />
              <div>
                <span className="block text-[10px] uppercase text-gray-400">
                  {language === "en" ? "Cashier" : "اسم الكاشير"}
                </span>
                <span className="font-semibold">{user?.name || "Cashier"}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 rtl:space-x-reverse text-gray-700 dark:text-gray-300">
              <FontAwesomeIcon icon={faClock} className="text-primary-500" />
              <div>
                <span className="block text-[10px] uppercase text-gray-400">
                  {language === "en" ? "Shift Time" : "تاريخ البدء"}
                </span>
                <span className="font-semibold text-xs">
                  {currentTime.toLocaleDateString(
                    language === "en" ? "en-US" : "ar-SA"
                  )}{" "}
                  {currentTime.toLocaleTimeString(
                    language === "en" ? "en-US" : "ar-SA"
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Cashier Selection (Only for Admin) */}
            {isAdmin && (
              <div>
                <label htmlFor="userId" className="label text-xs">
                  {language === "en" ? "Select Cashier" : "اختر الموظف / الكاشير *"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 rtl:left-auto rtl:right-0 rtl:pr-3.5">
                    <FontAwesomeIcon icon={faUser} />
                  </span>
                  <select
                    id="userId"
                    required
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="input min-h-12 pl-10 rtl:pl-3 rtl:pr-10 text-base font-bold"
                  >
                    <option value="">
                      {language === "en" ? "-- Choose Cashier --" : "-- اختر الكاشير --"}
                    </option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Device Number Input */}
            <div>
              <label htmlFor="deviceNumber" className="label text-xs">
                {language === "en" ? "Device/Register Number" : "رقم الجهاز / نقطة البيع"}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 rtl:left-auto rtl:right-0 rtl:pr-3.5">
                  <FontAwesomeIcon icon={faLaptop} />
                </span>
                <input
                  id="deviceNumber"
                  type="text"
                  required
                  placeholder={language === "en" ? "e.g. POS-01" : "مثال: POS-01"}
                  className="input min-h-12 pl-10 rtl:pl-3 rtl:pr-10 text-base"
                  value={deviceNumber}
                  onChange={(e) => setDeviceNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Opening Float Input */}
            <div>
              <label htmlFor="openingFloat" className="label text-xs">
                {language === "en" ? "Trust Amount / Opening Float" : "مبلغ العهدة الافتتاحية"}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 rtl:left-auto rtl:right-0 rtl:pr-3.5">
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                </span>
                <input
                  id="openingFloat"
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  placeholder={language === "en" ? "e.g. 150.00" : "مثال: 150.00"}
                  className="input min-h-12 pl-10 rtl:pl-3 rtl:pr-10 text-base font-bold text-emerald-600"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary min-h-12 text-base font-bold flex items-center justify-center gap-2 mt-2"
          >
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>
              {loading
                ? language === "en"
                  ? "Starting Shift..."
                  : "جاري البدء..."
                : language === "en"
                ? "Confirm & Start Shift"
                : "تأكيد وبدء الوردية"}
            </span>
          </button>
        </form>
      </div>

      {/* Styled animation keyframes */}
      <style>{`
        @keyframes slideOut {
          0% { transform: translateY(0); }
          100% { transform: translateY(35px); }
        }
        .animate-slide-out {
          animation: slideOut 1.5s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
        }
      `}</style>
    </div>
  );
}
