# 💰 Wealth Tracker React

A modern, responsive personal finance dashboard for comprehensive portfolio management. Built with React, TypeScript, and Tailwind CSS.

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-blue.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-7.1-purple.svg)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

![Dashboard Preview](https://via.placeholder.com/800x400/0F172A/60A5FA?text=Wealth+Tracker+Dashboard)

## ✨ Features

### 📊 **Interactive Dashboard**
- Real-time portfolio overview with total wealth calculation
- Interactive charts (pie, bar, area, line charts) powered by Recharts
- Asset distribution by class and currency
- Portfolio performance analytics

### 💳 **Account Management**
- Multiple account types: savings, checking, CDs, brokers, exchanges
- Multi-currency support (COP, USD, EUR, BTC, ETH, USDT)
- Integration with Colombian financial institutions (Bancolombia, Nu Bank, Trii, Binance)
- Automatic CD interest calculations

### 📈 **Investment Portfolio**
- Stock, fund, and cryptocurrency tracking
- Real-time price updates and performance metrics
- Asset class diversification analysis
- Portfolio allocation visualization

### 💸 **Transaction Management**
- Complete transaction history
- Automatic categorization
- Advanced filtering and search
- Income vs expense tracking

### 🌐 **Technical Excellence**
- **Responsive Design**: Mobile-first approach with hamburger navigation
- **Dark Mode**: Persistent theme switching with system preference detection
- **Real-time Sync**: Auto-sync capabilities with intelligent rate limiting
- **Offline Ready**: Local storage with progressive data loading
- **Error Handling**: Robust API error management with fallback systems

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/saforero65/wealth-tracker-react.git

# Navigate to project directory
cd wealth-tracker-react

# Install dependencies
npm install
# or
yarn install

# Start development server
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
# Build the project
npm run build
# or
yarn build

# Preview the production build
npm run preview
# or
yarn preview
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript 5.9** - Type-safe development
- **Vite 7.1** - Fast build tool and development server
- **Tailwind CSS 4.1** - Utility-first CSS framework

### UI Components
- **shadcn/ui** - Beautifully designed components built with Radix UI
- **Recharts** - Composable charting library built on React components
- **Lucide React** - Beautiful & consistent icon toolkit

### State Management
- **Zustand** - Small, fast, and scalable state management
- **React Hook Form** - Performant, flexible forms with easy validation
- **Zod** - TypeScript-first schema declaration and validation

### Data & Storage
- **LocalForage** - Offline storage improved
- **Date-fns** - Modern JavaScript date utility library
- **Nanoid** - A tiny, secure, URL-friendly unique string ID generator

## 📱 Mobile Experience

The application is fully responsive and optimized for mobile devices:

- **Touch-friendly interface** with appropriate tap targets
- **Hamburger navigation** for small screens
- **Optimized chart sizing** to prevent overflow
- **Mobile-first CSS** with responsive breakpoints
- **PWA capabilities** for app-like experience

## 🎨 Theme System

### Dark Mode Support
- **Automatic detection** of system preference
- **Manual toggle** with persistent storage
- **Smooth transitions** between themes
- **Complete coverage** across all components and charts

### Theme Testing
Open browser console and use the built-in theme tester:
```javascript
// Available theme testing functions
testTheme.setLight()    // Switch to light theme
testTheme.setDark()     // Switch to dark theme
testTheme.setSystem()   // Use system preference
testTheme.toggle()      // Toggle between light/dark
testTheme.status()      // Show current theme status
```

## 💰 Currency & Exchange Rates

### Supported Currencies
- **Fiat**: COP (Colombian Peso), USD, EUR
- **Cryptocurrencies**: BTC, ETH, USDT
- **Real-time rates** with intelligent caching
- **Fallback systems** for API failures

### Exchange Rate Features
- Multiple API providers with automatic failover
- Intelligent rate limiting to avoid API quotas
- Local caching with configurable TTL
- Graceful degradation when APIs are unavailable

## 📈 Financial Institutions Integration

Pre-configured support for Colombian financial institutions:

### Banks
- **Bancolombia** - Colombia's largest bank
- **Nu Bank** - Digital banking platform

### Investment Platforms
- **Trii** - Colombian investment platform
- **Binance** - Global cryptocurrency exchange

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Custom API endpoints
VITE_EXCHANGE_RATE_API=your_api_endpoint
VITE_GOOGLE_SHEETS_API_KEY=your_google_api_key
```

### Auto-sync Configuration
The app supports auto-sync with Google Sheets for data backup:
1. Navigate to Admin panel
2. Configure Google Sheets integration
3. Enable auto-sync with custom intervals

## 📊 Data Structure

### Account Types
- `savings` - Savings accounts
- `checking` - Checking accounts
- `cdt` - Certificates of Deposit
- `broker` - Investment brokerage accounts
- `exchange` - Cryptocurrency exchange accounts

### Asset Classes
- `acciones` - Stocks
- `fondos` - Mutual funds
- `bonos` - Bonds
- `crypto` - Cryptocurrencies
- `efectivo` - Cash equivalents

## 🧪 Development

### Project Structure
```
src/
├── components/        # Reusable UI components
│   └── ui/           # shadcn/ui components
├── contexts/         # React contexts (theme, etc.)
├── lib/              # Utility functions
├── pages/            # Main application pages
├── store/            # Zustand store configuration
├── types/            # TypeScript type definitions
└── adapters/         # Data adapters and API clients
```

### Code Quality
- **ESLint** configuration for code consistency
- **TypeScript** strict mode enabled
- **Prettier** formatting (recommended)
- **Component-based architecture** with clear separation of concerns

### Testing Theme System
```bash
# Development mode includes theme testing utilities
npm run dev

# Open browser console and use:
# window.testTheme for theme testing functions
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Build command
npm run build

# Publish directory
dist
```

### GitHub Pages
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy": "gh-pages -d dist"

npm run build
npm run deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use semantic commit messages
- Ensure responsive design compatibility
- Test both light and dark themes
- Maintain accessibility standards

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful component designs
- [Recharts](https://recharts.org/) for excellent charting capabilities
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS framework
- [Lucide](https://lucide.dev/) for consistent iconography

## 📞 Support

If you have any questions or need help getting started:

1. Check the [Issues](https://github.com/saforero65/wealth-tracker-react/issues) page
2. Create a new issue with detailed description
3. Join discussions in the repository

---

**Made with ❤️ for personal finance management**

*This project is perfect for developers looking for a complete fintech solution or as a foundation for larger financial applications.*
