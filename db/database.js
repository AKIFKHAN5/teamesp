const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

const defaultData = {
  products: [
    {
      id: 1,
      name: "1 Day Subscription",
      duration: "1 Day",
      description: "Perfect for trying out our premium PUBG features. Instant activation after payment.",
      price_pkr: 500,
      price_usdt: 1.80,
      badge: "",
      icon: "day",
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: "1 Week Subscription",
      duration: "1 Week",
      description: "Best value for regular players. Enjoy a full week of premium PUBG advantage.",
      price_pkr: 2500,
      price_usdt: 9.00,
      badge: "POPULAR",
      icon: "week",
      active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: "1 Month Subscription",
      duration: "1 Month",
      description: "Ultimate choice for dedicated players. Maximum savings with monthly access.",
      price_pkr: 8000,
      price_usdt: 29.00,
      badge: "BEST VALUE",
      icon: "month",
      active: true,
      created_at: new Date().toISOString()
    }
  ],
  reviews: [
    {
      id: 1,
      name: "AliKhan_PUBG",
      avatar: "AK",
      rating: 5,
      comment: "Best PUBG subscription service in Pakistan! Instant delivery and great support. Been using for 3 months straight.",
      date: "2024-12-15",
      verified: true
    },
    {
      id: 2,
      name: "ProGamer_786",
      avatar: "PG",
      rating: 5,
      comment: "Fast delivery, safe and secure. Team ESP never disappoints. 100% recommended to all PUBG players!",
      date: "2024-12-20",
      verified: true
    },
    {
      id: 3,
      name: "ZeeshanPlays",
      avatar: "ZP",
      rating: 5,
      comment: "Amazing service! Got my subscription within 2 minutes. The team is very responsive on WhatsApp.",
      date: "2025-01-05",
      verified: true
    },
    {
      id: 4,
      name: "UmarGaming",
      avatar: "UG",
      rating: 4,
      comment: "Very good service. Subscription activated quickly. Customer support is top notch. Will buy again!",
      date: "2025-01-10",
      verified: true
    },
    {
      id: 5,
      name: "FaisalPro",
      avatar: "FP",
      rating: 5,
      comment: "Trust me guys, this is the most reliable PUBG subscription provider. No scam, instant delivery!",
      date: "2025-01-18",
      verified: true
    },
    {
      id: 6,
      name: "BilalKing99",
      avatar: "BK",
      rating: 5,
      comment: "Using Team ESP for 6 months. Never had any issues. Price is fair and service is excellent!",
      date: "2025-01-25",
      verified: true
    }
  ],
  orders: [],
  chat_messages: [],
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
    admin_password_hash: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi" // password: password
  },
  faq: [
    {
      id: 1,
      question: "How long does delivery take?",
      answer: "Delivery is instant to 5 minutes after payment confirmation. We operate 24/7 to ensure fast service."
    },
    {
      id: 2,
      question: "Is my account safe?",
      answer: "Absolutely! We use 100% safe methods. Your account security is our top priority. We never ask for your login credentials."
    },
    {
      id: 3,
      question: "What payment methods do you accept?",
      answer: "We accept Binance Pay (USDT), EasyPaisa, and JazzCash. All transactions are secure and verified."
    },
    {
      id: 4,
      question: "Are subscriptions refundable?",
      answer: "All subscriptions are non-refundable once activated. Please make sure to choose the correct subscription before purchasing."
    },
    {
      id: 5,
      question: "How do I contact support?",
      answer: "You can reach us via Telegram (@crew_r47), WhatsApp (+923157744430), Instagram, or Discord. We respond within minutes!"
    },
    {
      id: 6,
      question: "Which PUBG version is supported?",
      answer: "We support PUBG Mobile (all regions). Contact us on Telegram for specific version compatibility queries."
    }
  ]
};

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    return defaultData;
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readDB, writeDB };
