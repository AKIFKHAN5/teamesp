const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, 'data.json');

const defaultData = {
  product: {
    id: 1, name: "PUBG Mobile Subscription",
    tagline: "Premium PUBG features. Instant activation. 100% Safe.",
    description: "Get the ultimate PUBG Mobile advantage. Choose the duration that fits your needs. All plans include instant delivery, 24/7 support, and 100% account safety.",
    main_image: "", gallery: [], video_url: "", active: true,
    tiers: [
      { id:"day",   label:"1 Day",   price_pkr:500,  price_usdt:1.80,  badge:"",           popular:false, description:"24-hour access to all premium features. Perfect for trying out the service or one-day tournaments." },
      { id:"week",  label:"1 Week",  price_pkr:2500, price_usdt:9.00,  badge:"POPULAR",    popular:true,  description:"7 days of uninterrupted gameplay. Most popular choice for regular players. Save 28% vs daily." },
      { id:"month", label:"1 Month", price_pkr:8000, price_usdt:29.00, badge:"BEST VALUE", popular:false, description:"30 days of full access. Best value for committed players. Save 47% vs daily pricing." }
    ]
  },
  features: [
    { id:1, icon:"fas fa-eye",        title:"ESP Visuals",       desc:"Advanced visual overlays for enhanced gameplay awareness", active:true },
    { id:2, icon:"fas fa-crosshairs", title:"Aimbot",            desc:"Precision aiming assistance for competitive advantage", active:true },
    { id:3, icon:"fas fa-tshirt",     title:"Custom Skins",      desc:"Unlock and customize character skins freely", active:true },
    { id:4, icon:"fas fa-bolt",       title:"Performance Boost", desc:"Optimized performance for smooth gameplay", active:true },
    { id:5, icon:"fas fa-shield-alt", title:"Anti-Detection",    desc:"99.9% safe from detection systems", active:true },
    { id:6, icon:"fas fa-lock",       title:"Secure",            desc:"Bank-level encryption for your data", active:true }
  ],
  versions: [
    { id:1, name:"Global",  package:"com.tencent.ig",    icon:"", supported:true },
    { id:2, name:"Korea",   package:"com.pubg.krmobile", icon:"", supported:true },
    { id:3, name:"Taiwan",  package:"com.rekoo.pubgm",   icon:"", supported:true },
    { id:4, name:"Vietnam", package:"vn.vng.pubgmobile",icon:"", supported:true }
  ],
  coupons: [
    { id:1, code:"WELCOME10", type:"percent", value:10, min_order:0,    expiry:"2026-12-31", usage_limit:100, used:0, active:true, description:"10% off for new customers" },
    { id:2, code:"SAVE500",   type:"fixed",   value:500,min_order:2000, expiry:"2026-12-31", usage_limit:50,  used:0, active:true, description:"PKR 500 off orders over PKR 2,000" }
  ],
  announcement: {
    enabled: false,
    message: "🎉 Special Offer: Get 10% OFF with code WELCOME10 — Limited Time!",
    type: "info",  // info, success, warning, sale
    show_close: true,
    link: "",
    link_text: ""
  },
  maintenance: {
    enabled: false,
    title: "We'll Be Right Back!",
    message: "Our website is undergoing scheduled maintenance. We'll be back online shortly. Thank you for your patience!",
    estimated_time: "1 hour"
  },
  reviews: [
    { id:1, name:"AliKhan_PUBG",  avatar:"AK", rating:5, comment:"Best PUBG subscription service in Pakistan! Instant delivery and great support.", date:"2024-12-15", verified:true },
    { id:2, name:"ProGamer_786",  avatar:"PG", rating:5, comment:"Fast delivery, safe and secure. Team ESP never disappoints. 100% recommended!", date:"2024-12-20", verified:true },
    { id:3, name:"ZeeshanPlays", avatar:"ZP", rating:5, comment:"Amazing service! Got my subscription within 2 minutes. Very responsive team.", date:"2025-01-05", verified:true },
    { id:4, name:"UmarGaming",   avatar:"UG", rating:4, comment:"Very good service. Subscription activated quickly. Will buy again!", date:"2025-01-10", verified:true },
    { id:5, name:"FaisalPro",    avatar:"FP", rating:5, comment:"Most reliable PUBG subscription provider. No scam, instant delivery!", date:"2025-01-18", verified:true },
    { id:6, name:"BilalKing99",  avatar:"BK", rating:5, comment:"Using Team ESP for 6 months. Never had any issues. Excellent service!", date:"2025-01-25", verified:true }
  ],
  orders: [], chat_messages: [], content: {},
  settings: {
    site_name:"Team ESP",
    tagline:"Premium PUBG Subscriptions at the best price. Safe, Fast & Trusted Service.",
    logo_url:"", favicon_url:"",
    background_url:"", background_enabled:false, background_opacity:0.15,
    telegram:"@crew_r47", whatsapp:"+923157744430", instagram:"x.691337", discord:"ig.4kky",
    binance_id:"303792532", binance_name:"AkifShehroz",
    easypaisa:"03402455177", easypaisa_name:"AKIF SHEHROZ",
    jazzcash:"03402455177", jazzcash_name:"AKIF SHEHROZ",
    happy_customers:"5000+", delivery_time:"1-5 MIN", rating:"4.9/5",
    admin_password_hash:"$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"
  },
  faq: [
    { id:1, question:"How long does delivery take?",       answer:"Delivery is instant to 5 minutes after payment confirmation. We operate 24/7." },
    { id:2, question:"Is my account safe?",               answer:"Absolutely! We use 100% safe methods. We never ask for your login credentials." },
    { id:3, question:"What payment methods do you accept?",answer:"We accept Binance Pay (USDT), EasyPaisa, and JazzCash. All transactions are secure." },
    { id:4, question:"Are subscriptions refundable?",     answer:"All subscriptions are non-refundable once activated. Please read FAQ before purchasing." },
    { id:5, question:"How do I contact support?",        answer:"Via Telegram (@crew_r47), WhatsApp (+923157744430), Instagram, or Discord. We reply within minutes!" },
    { id:6, question:"Which PUBG version is supported?", answer:"We support PUBG Mobile (all regions). Contact us on Telegram for compatibility queries." }
  ]
};

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
    return JSON.parse(JSON.stringify(defaultData));
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    if (!data.content)      data.content      = {};
    if (!data.features)     data.features     = defaultData.features;
    if (!data.versions)     data.versions     = defaultData.versions;
    if (!data.coupons)      data.coupons      = defaultData.coupons;
    if (!data.announcement) data.announcement = defaultData.announcement;
    if (!data.maintenance)  data.maintenance  = defaultData.maintenance;
    // Add tier descriptions to existing products
    if (data.product && data.product.tiers) {
      data.product.tiers.forEach((t,i) => {
        if (!t.description) t.description = defaultData.product.tiers[i]?.description || '';
      });
    }
    if (!data.settings.logo_url)          data.settings.logo_url = '';
    if (!data.settings.favicon_url)       data.settings.favicon_url = '';
    if (!data.settings.background_url)    data.settings.background_url = '';
    if (data.settings.background_enabled === undefined) data.settings.background_enabled = false;
    if (data.settings.background_opacity === undefined) data.settings.background_opacity = 0.15;
    return data;
  } catch(e) { return JSON.parse(JSON.stringify(defaultData)); }
}

function writeDB(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }
module.exports = { readDB, writeDB };
