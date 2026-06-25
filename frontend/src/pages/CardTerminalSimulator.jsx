import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faCircleNotch,
  faWifi,
  faCircleCheck,
  faCircleXmark,
  faClock,
  faLock,
  faSignal,
  faBatteryThreeQuarters,
  faVolumeUp,
  faSync,
} from "@fortawesome/free-solid-svg-icons";

// نغمات الصوت عبر Web Audio API
const playSound = (type) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    if (type === "tap") {
      // نغمة تمرير الكارت العادية (بيب واحدة قصيرة ومرتفعة)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } else if (type === "success") {
      // نغمة النجاح (ثنائية متصاعدة سعيدة)
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc1.type = "sine";
      osc2.type = "sine";
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);

      osc1.frequency.setValueAtTime(1500, audioCtx.currentTime);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.08);

      setTimeout(() => {
        osc2.frequency.setValueAtTime(2000, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.18);
      }, 80);
    } else if (type === "error") {
      // نغمة الخطأ (طنين منخفض وحزين)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
      
      // نغمة منخفضة إضافية للعمق
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = "sawtooth";
        osc2.frequency.setValueAtTime(140, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.06, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.3);
      }, 100);
    }
  } catch (e) {
    console.error("Audio Context beep failed:", e);
  }
};

function CardTerminalSimulator() {
  const [terminalState, setTerminalState] = useState("idle"); // idle, waiting_for_card, processing, approved, declined, timeout
  const [amount, setAmount] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState("approved"); // approved, declined, timeout
  const [isTapping, setIsTapping] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentTime, setCurrentTime] = useState("");
  const prevStatusRef = useRef("idle");

  // تحديث الساعة في الماكينة المحاكية
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // فحص حالة الماكينة من السيرفر دورياً (كل 1.5 ثانية)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get("/terminal/status");
        const { status: serverStatus, amount: serverAmount } = response.data;

        setAmount(serverAmount ? parseFloat(serverAmount) : null);
        
        // التحقق من تغير الحالة لإصدار تنبيهات صوتية أو بصرية
        if (serverStatus !== prevStatusRef.current) {
          if (serverStatus === "waiting_for_card" && prevStatusRef.current === "idle") {
            // نغمة تنبيه لوصول عملية جديدة
            playSound("tap");
          }
          prevStatusRef.current = serverStatus;
        }

        setTerminalState(serverStatus);
      } catch (err) {
        console.error("Error checking terminal status:", err);
        setErrorMsg("تعذر الاتصال بخادم النظام");
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1500);
    return () => clearInterval(interval);
  }, []);

  // إرسال استجابة وتمرير الكارت للمحاكي
  const handleCardTap = async () => {
    if (terminalState !== "waiting_for_card" || isTapping) return;

    setIsTapping(true);
    playSound("tap"); // صوت تمرير البطاقة

    // محاكاة الاتصال لبضعة أجزاء من الثانية بالواجهة لتجربة مستخدم ممتازة
    setTimeout(async () => {
      try {
        const response = await api.post("/terminal/action", {
          result: selectedOutcome,
        });
        
        const { status: newStatus } = response.data;
        setTerminalState(newStatus);
        
        // تشغيل صوت العملية حسب النتيجة
        if (selectedOutcome === "approved") {
          playSound("success");
        } else {
          playSound("error");
        }
      } catch (err) {
        console.error("Error executing card action:", err);
        setErrorMsg("حدث خطأ أثناء تمرير الكارت");
      } finally {
        setIsTapping(false);
      }
    }, 1200);
  };

  // تصفير الماكينة وإعادتها لوضع الخمول يدوياً
  const handleReset = async () => {
    try {
      await api.post("/terminal/reset");
      setTerminalState("idle");
      setAmount(null);
      setErrorMsg(null);
      playSound("tap");
    } catch (err) {
      console.error("Error resetting terminal:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-950 via-slate-900 to-indigo-950 text-white flex flex-col items-center justify-center p-4 overflow-hidden relative font-sans">
      {/* شبكة خلفية مستقبلية */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10">
        
        {/* العمود الأول: جهاز الماكينة الذكي (Terminal Device) */}
        <div className="flex flex-col items-center">
          
          {/* لمبات LED للشبكة ونظام الدفع اللا تلامسي (Contactless Indicators) */}
          <div className="flex space-x-3 rtl:space-x-reverse mb-3 justify-center">
            {[0, 1, 2, 3].map((i) => {
              let ledColor = "bg-gray-800 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]";
              
              if (terminalState === "waiting_for_card") {
                // تومض اللمبات باللون الأزرق استعداداً للدفع
                ledColor = "bg-blue-500 shadow-[0_0_10px_#3b82f6,inset_0_1px_2px_#ffffff80] animate-pulse";
              } else if (terminalState === "processing" || isTapping) {
                // تضيء اللمبات تدريجياً باللون الأزرق/البرتقالي
                ledColor = "bg-amber-400 shadow-[0_0_10px_#fbbf24,inset_0_1px_2px_#ffffff80]";
              } else if (terminalState === "approved") {
                // تضيء اللمبات باللون الأخضر الثابت
                ledColor = "bg-green-500 shadow-[0_0_12px_#22c55e,inset_0_1px_2px_#ffffff80]";
              } else if (terminalState === "declined" || terminalState === "timeout") {
                // تضيء باللون الأحمر
                ledColor = "bg-red-500 shadow-[0_0_12px_#ef4444,inset_0_1px_2px_#ffffff80]";
              }
              
              return (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${ledColor}`}
                  style={{ animationDelay: `${i * 150}ms` }}
                ></div>
              );
            })}
          </div>

          {/* جسم الماكينة الفيزيائي (Physical Device Mockup) */}
          <div className="relative w-[310px] h-[550px] bg-slate-900 border-[6px] border-slate-700 rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(99,102,241,0.1)] flex flex-col overflow-hidden">
            
            {/* سماعة الماكينة والميكروفون العلوي */}
            <div className="w-full h-8 flex justify-center items-center bg-slate-950 border-b border-slate-800">
              <div className="w-16 h-1 bg-gray-700 rounded-full"></div>
            </div>

            {/* شاشة العرض (LCD screen of the terminal) */}
            <div className="flex-1 m-3.5 bg-gray-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative shadow-inner">
              
              {/* شريط حالة الجهاز (Status Bar) */}
              <div className="px-4 py-1.5 bg-slate-900/60 border-b border-slate-900/40 text-[10px] text-gray-500 flex justify-between items-center select-none font-mono">
                <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                  <span>mada Pay</span>
                  <FontAwesomeIcon icon={faSignal} className="text-gray-600" />
                </div>
                <div>{currentTime}</div>
                <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
                  <FontAwesomeIcon icon={faVolumeUp} />
                  <FontAwesomeIcon icon={faBatteryThreeQuarters} />
                </div>
              </div>

              {/* محتوى الشاشة المتغير حسب حالة العملية */}
              <div className="flex-1 p-5 flex flex-col justify-between items-center text-center">
                
                {/* الجزء العلوي: شعار الشبكة (mada / Visa) */}
                <div className="w-full flex justify-between items-center opacity-85 select-none">
                  {/* مدى logo */}
                  <div className="bg-gradient-to-r from-blue-600 to-green-500 text-[10px] font-black px-1.5 py-0.5 rounded text-white tracking-widest uppercase">
                    mada
                  </div>
                  {/* فيزا logo */}
                  <div className="text-blue-500 font-extrabold text-sm italic tracking-tighter">
                    VISA
                  </div>
                </div>

                {/* الجزء الأوسط: نص وحالة العملية */}
                {terminalState === "idle" && (
                  <div className="space-y-4 my-auto animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-indigo-500 text-2xl shadow-lg">
                      <FontAwesomeIcon icon={faWifi} className="rotate-90 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-gray-300">جاهز لاستقبال العملية</h3>
                      <p className="text-xs text-gray-500 font-medium">في انتظار إرسال مبلغ السحب من جهاز الكاشير...</p>
                    </div>
                  </div>
                )}

                {terminalState === "waiting_for_card" && (
                  <div className="space-y-6 my-auto w-full animate-fade-in">
                    <div className="space-y-1">
                      <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider block">المبلغ المطلوب سحبه</span>
                      <div className="text-3xl font-black text-white bg-slate-900/80 py-3 px-4 rounded-xl border border-slate-800 inline-block w-full font-mono shadow-inner tracking-tight">
                        {amount?.toFixed(2)} <span className="text-xs font-normal text-gray-400">SAR</span>
                      </div>
                    </div>
                    
                    {/* منطقة التمرير التفاعلية (Contactless Tap Area) */}
                    <div 
                      onClick={handleCardTap}
                      className={`mx-auto w-24 h-24 rounded-full border-2 border-dashed border-indigo-500/40 hover:border-indigo-400/80 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-indigo-950/10 hover:bg-indigo-900/20 shadow-md ${isTapping ? "scale-95 animate-ping" : "animate-bounce"}`}
                    >
                      <FontAwesomeIcon icon={faWifi} className="text-3xl text-indigo-400 rotate-90" />
                      <span className="text-[9px] text-indigo-300 mt-2 font-bold uppercase select-none">مرر البطاقة</span>
                    </div>

                    <p className="text-[11px] text-gray-400 font-medium px-2">
                      انقر على الكارت على اليمين لتمريره، أو انقر هنا مباشرة للمحاكاة السريعة
                    </p>
                  </div>
                )}

                {(terminalState === "processing" || isTapping) && (
                  <div className="space-y-4 my-auto animate-fade-in">
                    <div className="text-4xl text-indigo-500 animate-spin">
                      <FontAwesomeIcon icon={faCircleNotch} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-gray-300">جاري الاتصال بالبنك</h3>
                      <p className="text-xs text-gray-500 font-medium">يرجى الانتظار، جاري التحقق وصرف العملية...</p>
                    </div>
                  </div>
                )}

                {terminalState === "approved" && (
                  <div className="space-y-4 my-auto animate-fade-in">
                    <div className="text-5xl text-green-500 bg-green-950/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                      <FontAwesomeIcon icon={faCircleCheck} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-green-400">تمت العملية بنجاح</h3>
                      <span className="text-[10px] text-gray-500 block font-mono">APPROVAL: #{Math.floor(100000 + Math.random() * 900000)}</span>
                      <p className="text-xs text-gray-400 font-medium">تم خصم {amount?.toFixed(2)} ر.س بنجاح</p>
                    </div>
                  </div>
                )}

                {terminalState === "declined" && (
                  <div className="space-y-4 my-auto animate-fade-in">
                    <div className="text-5xl text-red-500 bg-red-950/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                      <FontAwesomeIcon icon={faCircleXmark} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-red-400">العملية مرفوضة</h3>
                      <p className="text-xs text-red-500/80 font-bold">عذراً، الرصيد غير كافٍ</p>
                      <p className="text-xs text-gray-500 font-medium">يرجى استخدام بطاقة أخرى أو المحاولة مجدداً</p>
                    </div>
                  </div>
                )}

                {terminalState === "timeout" && (
                  <div className="space-y-4 my-auto animate-fade-in">
                    <div className="text-5xl text-amber-500 bg-amber-950/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                      <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-amber-400">انتهت المهلة</h3>
                      <p className="text-xs text-gray-500 font-medium">لم يتم تمرير البطاقة بالوقت المحدد للعملية</p>
                    </div>
                  </div>
                )}

                {/* الجزء السفلي للشاشة: حماية مالية */}
                <div className="w-full flex items-center justify-center space-x-1.5 rtl:space-x-reverse text-gray-600 text-[9px] border-t border-slate-900/60 pt-2 select-none">
                  <FontAwesomeIcon icon={faLock} />
                  <span>اتصال مشفر وآمن 100%</span>
                </div>

              </div>
            </div>

            {/* الحواف السفلية للجهاز وفتحة خروج الورق/الفاتورة */}
            <div className="px-8 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center rounded-b-[30px]">
              {/* زر خيارات الماكينة */}
              <button 
                onClick={handleReset} 
                className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-gray-500 hover:text-white transition-all shadow hover:bg-slate-800 active:scale-95"
                title="تصفير وإعادة تعيين الماكينة"
              >
                <FontAwesomeIcon icon={faSync} className={terminalState === "processing" ? "animate-spin" : ""} />
              </button>
              
              {/* شعار الشركة المصنعة */}
              <span className="text-[10px] text-gray-600 tracking-widest font-black uppercase select-none">
                SMART-POS
              </span>

              {/* زر التشغيل */}
              <div className="w-4 h-4 rounded-full bg-green-600/30 border border-green-600/60 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              </div>
            </div>

          </div>
        </div>

        {/* العمود الثاني: البطاقة الذكية التفاعلية وإعدادات الفحص */}
        <div className="space-y-6 flex flex-col justify-center">
          
          <div>
            <h2 className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-indigo-400">
              شاشة محاكاة جهاز مبيعات البطاقة
            </h2>
            <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
              تقوم هذه الصفحة بمحاكاة جهاز دفع شبكي فيزيائي مستقل. افتح هذه الصفحة على جوالك أو في شاشة أخرى لمحاكاة التدفق الطبيعي لدفع العملاء بالمحل.
            </p>
          </div>

          {/* البطاقة التفاعلية (Interactive Credit Card) */}
          <div className="flex flex-col items-center">
            <div 
              onClick={handleCardTap}
              className={`relative w-[340px] h-[210px] rounded-[20px] bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 border border-white/10 p-5 shadow-[0_15px_35px_rgba(0,0,0,0.5),0_0_20px_rgba(99,102,241,0.15)] flex flex-col justify-between overflow-hidden cursor-pointer select-none transition-all duration-500 group ${
                terminalState === "waiting_for_card" 
                  ? "hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(99,102,241,0.3)] hover:border-indigo-400/40" 
                  : "opacity-40 cursor-not-allowed"
              }`}
            >
              {/* رقاقة البطاقة وعلامة NFC */}
              <div className="flex justify-between items-start">
                {/* رقاقة الكترونية ذهبية */}
                <div className="w-12 h-9 rounded-lg bg-gradient-to-r from-amber-400 to-amber-200 border border-amber-300 relative overflow-hidden shadow-md">
                  <div className="absolute inset-x-0 top-3 border-t border-amber-600/30"></div>
                  <div className="absolute inset-x-0 bottom-3 border-t border-amber-600/30"></div>
                  <div className="absolute inset-y-0 left-4 border-r border-amber-600/30"></div>
                  <div className="absolute inset-y-0 right-4 border-r border-amber-600/30"></div>
                </div>
                {/* رمز الدفع السريع NFC */}
                <FontAwesomeIcon icon={faWifi} className="text-xl text-gray-400 rotate-90 group-hover:text-indigo-400 transition-colors" />
              </div>

              {/* أرقام البطاقة */}
              <div className="text-lg font-bold font-mono tracking-widest text-gray-200 drop-shadow mt-4">
                4228  ••••  ••••  8972
              </div>

              {/* بيانات البطاقة والشعار */}
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">حامل البطاقة</div>
                  <div className="text-xs font-bold text-gray-300 tracking-wider">زياد بن يوسف</div>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className="text-[8px] text-gray-500 font-bold">صلاحية البطاقة</div>
                  <div className="text-[10px] font-bold text-gray-300 font-mono">12 / 29</div>
                </div>
                
                {/* شعار مدى وشعار فيزا التخيلي */}
                <div className="flex space-x-2 rtl:space-x-reverse items-center bg-white/5 py-1 px-2 rounded-lg border border-white/5">
                  <div className="bg-gradient-to-r from-blue-600 to-green-500 text-[8px] font-black px-1.5 py-0.5 rounded text-white tracking-wider uppercase">
                    mada
                  </div>
                  <div className="text-white font-extrabold text-[10px] italic tracking-tighter">
                    VISA
                  </div>
                </div>
              </div>

              {/* طبقة توهج علوية */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none"></div>
            </div>
            
            {terminalState === "waiting_for_card" && (
              <span className="text-xs text-indigo-400 font-extrabold mt-3 animate-pulse">
                👋 انقر فوق البطاقة لتمريرها على الماكينة والدفع
              </span>
            )}
          </div>

          {/* لوحة التحكم بخيار النتيجة للـ Tester */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-300 flex items-center space-x-2 rtl:space-x-reverse">
              <span>⚙️ خيارات الاختبار (سلوك المعاملة):</span>
            </h3>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "approved", label: "قبول (Approved)", color: "border-green-600/30 text-green-400 hover:bg-green-950/20", activeColor: "bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)] border-green-500" },
                { id: "declined", label: "رفض (Declined)", color: "border-red-600/30 text-red-400 hover:bg-red-950/20", activeColor: "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] border-red-500" },
                { id: "timeout", label: "مهلة (Timeout)", color: "border-amber-600/30 text-amber-400 hover:bg-amber-950/20", activeColor: "bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] border-amber-500" },
              ].map((outcome) => {
                const isActive = selectedOutcome === outcome.id;
                return (
                  <button
                    key={outcome.id}
                    type="button"
                    onClick={() => {
                      setSelectedOutcome(outcome.id);
                      playSound("tap");
                    }}
                    className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all duration-300 ${
                      isActive ? outcome.activeColor : `bg-slate-900 ${outcome.color} border-slate-700/80`
                    }`}
                  >
                    {outcome.label}
                  </button>
                );
              })}
            </div>
            
            <div className="text-xs text-gray-500 leading-relaxed pt-2 border-t border-slate-800">
              <strong>شرح التدفق:</strong> حدد النتيجة المفترضة أعلاه، ثم قم بتمرير البطاقة (بالنقر عليها). سيتم تحديث حالة النظام وسيشعر الكاشير بالنتيجة تلقائياً.
            </div>
          </div>

          {/* رسائل الخطأ والتنبيهات */}
          {errorMsg && (
            <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl text-xs text-red-400 text-center font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* زر إعادة التهيئة اليدوية السريعة */}
          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-gray-400 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 rtl:space-x-reverse"
            >
              <span>إعادة تصفير الماكينة بالكامل</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default CardTerminalSimulator;
