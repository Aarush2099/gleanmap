import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "es" | "fr" | "ar" | "zh";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "zh", label: "Chinese", native: "简体中文" },
];

type Dict = Record<string, string>;

const EN: Dict = {
  "nav.home": "Home",
  "nav.hub": "The Hub",
  "nav.october": "October · Research",
  "nav.november": "November · Action",
  "nav.leaderboard": "Leaderboard",
  "nav.instructions": "Instructions",
  "nav.partners": "Partners",
  "nav.faq": "FAQ",
  "cta.login": "Log In",
  "hero.badge": "PGC 2026 · Evolution",
  "hero.title_a": "30 days of research.",
  "hero.title_b": "30 days of action.",
  "hero.lede": "October is research. November is action. Project Green Challenge 2026 turns curious students into informed leaders for a thriving planet.",
  "hero.cta_hub": "Enter The Hub",
  "hero.cta_challenges": "See Challenges & Research",
  "hero.october_in": "October launches in",
  "hero.october_sub": "30 Days · Research Mode",
  "hero.november_in": "November launches in",
  "hero.november_sub": "30 Days · Action Mode",
  "hero.live": "Live",
  "time.days": "Days", "time.hrs": "Hrs", "time.min": "Min", "time.sec": "Sec",
  "what.title": "What is PGC?",
  "what.lede": "30 days of research. 30 days of action. Daily themes. Real institutional transformation.",
  "cards.themes.t": "Daily Themes",
  "cards.themes.d": "30 unique themes across October — energy, food, justice, biodiversity & more.",
  "cards.audits.t": "Regional Audits",
  "cards.audits.d": "October challenges ask you to document conditions in your hometown.",
  "cards.action.t": "Campus Action",
  "cards.action.d": "November unlocks a country-specific action prompt informed by your October research.",
  "cards.resume.t": "Climate Passport",
  "cards.resume.d": "Every submission becomes a stamp in your shareable Climate Passport.",
  "cards.bracket.t": "Global Leaderboard",
  "cards.bracket.d": "Compete on individual and country leaderboards in real time.",
  "cards.ai.t": "PGC AI Assistant",
  "cards.ai.d": "An on-site research companion that helps you interpret data and frame actions.",
  "cta.strip.title": "Your country needs you on the leaderboard.",
  "cta.strip.lede": "Sign up in 60 seconds. Add your country. Start earning points the moment Day 1 unlocks.",
  "cta.strip.standings": "See standings",
  "footer.tag": "30 days of action. One global movement. PGC 2026 turns curious students into informed, active, global leaders for a thriving planet.",
  "footer.explore": "Explore",
  "footer.resources": "Resources",
  "footer.copyright": "© 2026 Project Green Challenge · Evolution prototype",
  "footer.handle": "Made with care · #PGC2026",
  "lang.label": "Language",
  "ai.title": "PGC AI",
  "ai.subtitle": "Climate research companion",
  "ai.placeholder": "Ask about themes, audits, actions…",
  "ai.send": "Send",
  "ai.welcome": "Hi! I'm PGC AI. Ask me about climate themes, your regional audit, or campus action ideas.",
};

const ES: Dict = {
  "nav.home": "Inicio", "nav.hub": "El Centro",
  "nav.october": "Octubre · Investigación", "nav.november": "Noviembre · Acción",
  "nav.leaderboard": "Clasificación", "nav.instructions": "Instrucciones",
  "nav.partners": "Aliados", "nav.faq": "Preguntas", "cta.login": "Iniciar sesión",
  "hero.badge": "PGC 2026 · Evolución",
  "hero.title_a": "60 días.", "hero.title_b": "Una generación.",
  "hero.lede": "Octubre es investigación. Noviembre es acción. PGC 2026 convierte a estudiantes curiosos en líderes informados por un planeta próspero.",
  "hero.cta_hub": "Entrar al Centro", "hero.cta_challenges": "Ver los 60 retos",
  "hero.october_in": "Octubre comienza en", "hero.october_sub": "30 Días · Investigación",
  "hero.november_in": "Noviembre comienza en", "hero.november_sub": "30 Días · Acción",
  "hero.live": "En vivo",
  "time.days": "Días", "time.hrs": "Hrs", "time.min": "Min", "time.sec": "Seg",
  "footer.copyright": "© 2026 Project Green Challenge · Prototipo de Evolución",
  "footer.handle": "Hecho con cariño · #PGC2026",
  "ai.title": "PGC IA", "ai.subtitle": "Asistente de investigación climática",
  "ai.placeholder": "Pregunta sobre temas, auditorías, acciones…",
  "ai.send": "Enviar",
  "ai.welcome": "¡Hola! Soy PGC IA. Pregúntame sobre temas climáticos, tu auditoría regional o ideas de acción.",
};

const FR: Dict = {
  "nav.home": "Accueil", "nav.hub": "Le Hub",
  "nav.october": "Octobre · Recherche", "nav.november": "Novembre · Action",
  "nav.leaderboard": "Classement", "nav.instructions": "Instructions",
  "nav.partners": "Partenaires", "nav.faq": "FAQ", "cta.login": "Se connecter",
  "hero.title_a": "60 jours.", "hero.title_b": "Une génération.",
  "hero.lede": "Octobre est la recherche. Novembre est l'action. PGC 2026 transforme les étudiants en leaders éclairés pour une planète prospère.",
  "hero.cta_hub": "Entrer dans le Hub", "hero.cta_challenges": "Voir les 60 défis",
  "hero.october_in": "Octobre commence dans", "hero.october_sub": "30 jours · Recherche",
  "hero.november_in": "Novembre commence dans", "hero.november_sub": "30 jours · Action",
  "hero.live": "En direct",
  "time.days": "Jours", "time.hrs": "Hrs", "time.min": "Min", "time.sec": "Sec",
  "footer.handle": "Fait avec soin · #PGC2026",
  "ai.title": "PGC IA", "ai.subtitle": "Assistant de recherche climatique",
  "ai.placeholder": "Posez une question…", "ai.send": "Envoyer",
  "ai.welcome": "Bonjour ! Je suis PGC IA. Posez-moi des questions sur les thèmes climatiques.",
};

const AR: Dict = {
  "nav.home": "الرئيسية", "nav.hub": "المركز",
  "nav.october": "أكتوبر · البحث", "nav.november": "نوفمبر · العمل",
  "nav.leaderboard": "لوحة الصدارة", "nav.instructions": "التعليمات",
  "nav.partners": "الشركاء", "nav.faq": "الأسئلة", "cta.login": "تسجيل الدخول",
  "hero.title_a": "٦٠ يومًا.", "hero.title_b": "جيل واحد.",
  "hero.lede": "أكتوبر للبحث. نوفمبر للعمل. تحدي المشروع الأخضر ٢٠٢٦ يحوّل الطلاب إلى قادة واعين من أجل كوكب مزدهر.",
  "hero.cta_hub": "ادخل المركز", "hero.cta_challenges": "شاهد التحديات الـ٦٠",
  "hero.october_in": "ينطلق أكتوبر بعد", "hero.october_sub": "٣٠ يومًا · وضع البحث",
  "hero.november_in": "ينطلق نوفمبر بعد", "hero.november_sub": "٣٠ يومًا · وضع العمل",
  "hero.live": "مباشر",
  "time.days": "أيام", "time.hrs": "ساعات", "time.min": "دقائق", "time.sec": "ثوانٍ",
  "footer.handle": "صُنع بعناية · #PGC2026",
  "ai.title": "PGC AI", "ai.subtitle": "مساعد البحث المناخي",
  "ai.placeholder": "اطرح سؤالاً…", "ai.send": "إرسال",
  "ai.welcome": "مرحباً! أنا PGC AI. اسألني عن المواضيع المناخية.",
};

const ZH: Dict = {
  "nav.home": "首页", "nav.hub": "中心",
  "nav.october": "十月 · 研究", "nav.november": "十一月 · 行动",
  "nav.leaderboard": "排行榜", "nav.instructions": "说明",
  "nav.partners": "合作伙伴", "nav.faq": "常见问题", "cta.login": "登录",
  "hero.title_a": "60 天。", "hero.title_b": "一代人。",
  "hero.lede": "十月是研究。十一月是行动。PGC 2026 让好奇的学生成为可持续未来的知识型领袖。",
  "hero.cta_hub": "进入中心", "hero.cta_challenges": "查看 60 项挑战",
  "hero.october_in": "十月开始还有", "hero.october_sub": "30 天 · 研究模式",
  "hero.november_in": "十一月开始还有", "hero.november_sub": "30 天 · 行动模式",
  "hero.live": "直播",
  "time.days": "天", "time.hrs": "时", "time.min": "分", "time.sec": "秒",
  "footer.handle": "用心制作 · #PGC2026",
  "ai.title": "PGC AI", "ai.subtitle": "气候研究助手",
  "ai.placeholder": "提出问题…", "ai.send": "发送",
  "ai.welcome": "你好！我是 PGC AI。可以问我气候主题相关的问题。",
};

const DICTS: Record<Lang, Dict> = { en: EN, es: ES, fr: FR, ar: AR, zh: ZH };

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string; dir: "ltr" | "rtl" };
const I18nContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => k, dir: "ltr" });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem("pgc.lang")) as Lang | null;
    if (saved && DICTS[saved]) { setLangState(saved); return; }
    const nav = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en";
    const match = LANGS.find((l) => nav.startsWith(l.code));
    if (match) setLangState(match.code);
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
    }
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof localStorage !== "undefined") localStorage.setItem("pgc.lang", l);
  };

  const t = (key: string) => DICTS[lang][key] ?? DICTS.en[key] ?? key;

  return <I18nContext.Provider value={{ lang, setLang, t, dir }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
