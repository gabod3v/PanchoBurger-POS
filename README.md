# 🍔 Pancho Burger POS - Quick Bite Ops

**Pancho Burger POS** is a modern, high-performance Point of Sale (POS) system designed for efficiency in fast-food environments. It features a robust dual-currency engine (USD/Bs), offline-first synchronization, and a premium administrative dashboard.

![Banner](public/assets/screenshots/menu.png)

## 🚀 Key Features

- **💸 Dual-Currency Support**: Real-time conversion between USD and Bolívares (Bs.). Prices can be dynamically calculated based on the daily exchange rate or fixed in local currency.
- **⚡ Offline-First Architecture**: Keep taking orders even without internet. The system queues all operations and syncs them automatically with Supabase once the connection is restored.
- **📋 Order Management**: Complete order lifecycle (Pending → Ready → Completed) with detailed line-item breakdowns, unit pricing, and status tracking.
- **💹 Cash Register Mastery**: Integrated session management that allows setting the daily exchange rate and bulk-updating prices for items fixed in local currency.
- **📁 Menu & Categories**: Intuitive product management with category filtering and dynamic scroll areas for fast catalog navigation.
- **🖨️ Professional Receipts**: Clean, print-ready CSS tickets for physical receipt printers.

## 📸 Screenshots

````carousel
![Catalog](public/assets/screenshots/menu.png)
<!-- slide -->
![Order Screen](public/assets/screenshots/order.png)
<!-- slide -->
![Order History](public/assets/screenshots/history.png)
````

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI, Lucid Icons
- **Backend & Auth**: Supabase (PostgreSQL)
- **State Management**: React Context + Reducer with LocalStorage persistence
- **Sync**: Custom Sync Queue for Offline Support

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/gabod3v/quick-bite-ops.git
   cd quick-bite-ops
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request for improvements.

---
Developed with ❤️ by **gabod3v**
