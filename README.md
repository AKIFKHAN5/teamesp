# 🎮 Team ESP — Premium PUBG Subscription Website

A complete, professional PUBG subscription website with admin panel, live chatbot, reviews system, and order management.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
# OR
node server.js
```

### 3. Open Your Website
- **Website:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **Default Admin Password:** `password` ← CHANGE THIS IMMEDIATELY!

---

## 🛠️ Project Structure

```
teamesp/
├── server.js          # Main backend server (Node.js + Express)
├── package.json       # Dependencies
├── db/
│   ├── database.js    # Database layer
│   └── data.json      # Auto-created on first run (your data)
├── public/
│   ├── index.html     # Main website
│   ├── css/style.css  # All styles
│   └── js/main.js     # Frontend JavaScript
└── admin/
    └── index.html     # Admin panel (single file)
```

---

## 🔐 Admin Panel Features

Login at: `/admin` with your password

| Section | What You Can Do |
|---------|----------------|
| **Dashboard** | View stats, recent orders |
| **Products** | Add/Edit/Delete subscription plans, set prices, badges |
| **Orders** | View all orders, update status, delete |
| **Reviews** | Approve/verify/delete customer reviews |
| **FAQ** | Add/Edit/Delete FAQ items |
| **Settings** | Change site name, payment details, social links, password |

---

## 💳 Payment Details (Pre-configured)

- **Binance Pay (USDT):** ID 303792532 — AkifShehroz
- **EasyPaisa:** 03402455177 — AKIF SHEHROZ
- **JazzCash:** 03402455177 — AKIF SHEHROZ

*Change these in Admin → Settings*

---

## 📱 Contact Links (Pre-configured)

- Telegram: @crew_r47
- WhatsApp: +923157744430
- Instagram: x.691337
- Discord: ig.4kky

*Change these in Admin → Settings*

---

## 🌐 Hosting on VPS (Recommended)

### Step 1: Upload files to your VPS
```bash
# Using SCP
scp -r ./teamesp user@your-server-ip:/var/www/

# OR using FTP/FileZilla
# Upload entire teamesp folder
```

### Step 2: Install Node.js on VPS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 3: Install dependencies & start
```bash
cd /var/www/teamesp
npm install
node server.js
```

### Step 4: Run permanently with PM2
```bash
# Install PM2
npm install -g pm2

# Start your site
pm2 start server.js --name teamesp

# Auto-start on reboot
pm2 startup
pm2 save
```

### Step 5: Nginx reverse proxy (for domain)
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: SSL Certificate (Free HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔒 Security Checklist

- [ ] Change admin password immediately (Admin → Settings)
- [ ] Set a strong JWT secret: `JWT_SECRET=your_random_secret node server.js`
- [ ] Update all payment details in Admin → Settings
- [ ] Update all social links in Admin → Settings
- [ ] Enable HTTPS with Let's Encrypt

---

## 🌍 Recommended Hosting Providers

| Provider | Price | Best For |
|----------|-------|----------|
| **Contabo VPS** | ~$5/mo | Budget, Pakistan users |
| **DigitalOcean** | $6/mo | Easy setup, great docs |
| **Hostinger VPS** | $5/mo | Good performance |
| **Vultr** | $6/mo | Fast SSD servers |

---

## 📞 Tech Support

Website built with:
- **Backend:** Node.js + Express 5
- **Frontend:** HTML5 + CSS3 + Vanilla JS
- **Database:** JSON file (no setup needed)
- **Auth:** JWT + bcrypt
- **Fonts:** Orbitron, Exo 2, Rajdhani
- **Icons:** Font Awesome 6.5

