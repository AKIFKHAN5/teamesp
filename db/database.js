const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

const defaultData = {
  // Single grouped product with duration tiers
  product: {
    id: 1,
    name: "PUBG Mobile Subscription",
    tagline: "Premium PUBG features. Instant activation. 100% Safe.",
    description: "Get the ultimate PUBG Mobile advantage. Choose the duration that fits your needs. All plans include instant delivery, 24/7 support, and 100% account safety.",
    main_image: "",
    gallery: [],
    video_url: "",
    active: true,
    tiers: [
      { id: "day",   label: "1 Day",   price_pkr: 500,  price_usdt: 1.80, badge: "",           popular: false },
      { id: "week",  label: "1 Week",  price_pkr: 2500, price_usdt: 9.00, badge: "POPULAR",    popular: true  },
      { id: "month", label: "1 Month", price_pkr: 8000, price_usdt: 29.00,badge: "BEST VALUE", popular: false }
    ]
  },
  // cart_items: stored server-side per session (optional, we handle client-side)
  reviews: [
    { id: 1, name: "AliKhan_PUBG",  avatar: "AK", rating: 5, comment: "Best PUBG subscription service in Pakistan! Instant delivery and great support. Been using for 3 months straight.", date: "2024-12-15", verified: true },
    { id: 2, name: "ProGamer_786",  avatar: "PG", rating: 5, comment: "Fast delivery, safe and secure. Team ESP never disappoints. 100% recommended to all PUBG players!", date: "2024-12-20", verified: true },
    { id: 3, name: "ZeeshanPlays", avatar: "ZP", rating: 5, comment: "Amazing service! Got my subscription within 2 minutes. The team is very responsive on WhatsApp.", date: "2025-01-05", verified: true },
    { id: 4, name: "UmarGaming",   avatar: "UG", rating: 4, comment: "Very good service. Subscription activated quickly. Customer support is top notch. Will buy again!", date: "2025-01-10", verified: true },
    { id: 5, name: "FaisalPro",    avatar: "FP", rating: 5, comment: "Trust me guys, this is the most reliable PUBG subscription provider. No scam, instant delivery!", date: "2025-01-18", verified: true },
    { id: 6, name: "BilalKing99",  avatar: "BK", rating: 5, comment: "Using Team ESP for 6 months. Never had any issues. Price is fair and service is excellent!", date: "2025-01-25", verified: true }
  ],
  orders: [],
  chat_messages: [],
  content: {},   // stores all click-to-edit text edits keyed by element id
  settings: {
    site_name: "Team ESP",
    tagline: "Premium PUBG Subscriptions at the best price. Safe, Fast & Trusted Service.",
    telegram: "@crew_r47",
    whatsapp: "+923157744430",
    instagram: "x.691337",
    discord: "ig.4kky",
    binance_id: "303792532",
    binance_name: "AkifShehroz",
    easypaisa: "03402455177",
    easypaisa_name: "AKIF SHEHROZ",
    jazzcash: "03402455177",
    jazzcash_name: "AKIF SHEHROZ",
    happy_customers: "5000+",
    delivery_time: "1-5 MIN",
    rating: "4.9/5",
    admin_password_hash: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"
  },
  faq: [
    { id: 1, question: "How long does delivery take?", answer: "Delivery is instant to 5 minutes after payment confirmation. We operate 24/7 to ensure fast service." },
    { id: 2, question: "Is my account safe?", answer: "Absolutely! We use 100% safe methods. Your account security is our top priority. We never ask for your login credentials." },
    { id: 3, question: "What payment methods do you accept?", answer: "We accept Binance Pay (USDT), EasyPaisa, and JazzCash. All transactions are secure and verified." },
    { id: 4, question: "Are subscriptions refundable?", answer: "All subscriptions are non-refundable once activated. Please make sure to choose the correct subscription before purchasing." },
    { id: 5, question: "How do I contact support?", answer: "You can reach us via Telegram (@crew_r47), WhatsApp (+923157744430), Instagram, or Discord. We respond within minutes!" },
    { id: 6, question: "Which PUBG version is supported?", answer: "We support PUBG Mobile (all regions). Contact us on Telegram for specific version compatibility queries." }
  ]
};

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
    return JSON.parse(JSON.stringify(defaultData));
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    // Migrate old products array to new single product format
    if (data.products && !data.product) {
      data.product = defaultData.product;
      delete data.products;
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    }
    if (!data.content) data.content = {};
    return data;
  } catch (e) {
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readDB, writeDB };
