# Stock Market Alert Platform - Complete Code Export

This file contains all the code needed to implement the stock market alert platform design.

---

## File: /App.tsx

```tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Search from './components/Search';
import Watchlist from './components/Watchlist';
import Profile from './components/Profile';
import Alerts from './components/Alerts';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn onSignIn={() => setIsAuthenticated(true)} />} />
        <Route path="/signup" element={<SignUp onSignUp={() => setIsAuthenticated(true)} />} />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/signin" />} 
        />
        <Route 
          path="/search" 
          element={isAuthenticated ? <Search /> : <Navigate to="/signin" />} 
        />
        <Route 
          path="/watchlist" 
          element={isAuthenticated ? <Watchlist /> : <Navigate to="/signin" />} 
        />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Profile /> : <Navigate to="/signin" />} 
        />
        <Route 
          path="/alerts" 
          element={isAuthenticated ? <Alerts /> : <Navigate to="/signin" />} 
        />
        <Route path="/" element={<Navigate to="/signin" />} />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
}
```

---

## File: /components/SignIn.tsx

```tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { TrendingUp } from 'lucide-react';

interface SignInProps {
  onSignIn: () => void;
}

export default function SignIn({ onSignIn }: SignInProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    onSignIn();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <TrendingUp className="size-8 text-emerald-500" />
          <span className="text-emerald-500 tracking-wide">Marketimi</span>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-8">
          <h1 className="mb-2">Welcome back</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Please enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="bg-black border-zinc-800"
              />
              {error && !email && (
                <p className="text-red-500 text-sm">Email is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="bg-black border-zinc-800"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Sign In
            </Button>
          </form>

          <p className="text-center mt-6 text-zinc-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-emerald-500 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## File: /components/SignUp.tsx

```tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TrendingUp } from 'lucide-react';

interface SignUpProps {
  onSignUp: () => void;
}

export default function SignUp({ onSignUp }: SignUpProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    country: '',
    investmentGoals: '',
    riskTolerance: '',
    preferredIndustry: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignUp();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <TrendingUp className="size-8 text-emerald-500" />
          <span className="text-emerald-500 tracking-wide">Marketimi</span>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-8">
          <h1 className="mb-2">Create an account</h1>
          <p className="text-zinc-400 mb-8">Join Marketimi to start tracking stocks</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-black border-zinc-800"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-black border-zinc-800"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-black border-zinc-800"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, country: value })}>
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="ca">Canada</SelectItem>
                  <SelectItem value="hu">Hungary</SelectItem>
                  <SelectItem value="de">Germany</SelectItem>
                  <SelectItem value="fr">France</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="investmentGoals">Investment Goals</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, investmentGoals: value })}>
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="preservation">Capital Preservation</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskTolerance">Risk Tolerance</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, riskTolerance: value })}>
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue placeholder="Select your risk tolerance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredIndustry">Preferred Industry</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, preferredIndustry: value })}>
                <SelectTrigger className="bg-black border-zinc-800">
                  <SelectValue placeholder="Select your preferred industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="energy">Energy</SelectItem>
                  <SelectItem value="consumer">Consumer Goods</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Create Account
            </Button>
          </form>

          <p className="text-center mt-6 text-zinc-400">
            Already have an account?{' '}
            <Link to="/signin" className="text-emerald-500 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## File: /components/Header.tsx

```tsx
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, User, Settings, LogOut, Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';

export default function Header() {
  const navigate = useNavigate();

  const handleSignOut = () => {
    navigate('/signin');
  };

  return (
    <header className="bg-zinc-950 border-b border-zinc-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2">
            <TrendingUp className="size-6 text-emerald-500" />
            <span className="text-emerald-500 tracking-wide">Marketimi</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/search" 
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Search
            </Link>
            <Link 
              to="/watchlist" 
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Watchlist
            </Link>
            <Link 
              to="/alerts" 
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Alerts
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <Bell className="size-5 text-zinc-400" />
            <Badge className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 bg-red-500 text-white border-0">
              3
            </Badge>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 hover:bg-zinc-800 rounded-lg p-2 transition-colors">
              <Avatar className="size-8">
                <AvatarFallback className="bg-yellow-500 text-black">
                  AM
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">adaup tafara matinya</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem 
                onClick={() => navigate('/profile')}
                className="cursor-pointer focus:bg-zinc-800"
              >
                <User className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-zinc-800">
                <Settings className="mr-2 size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/alerts')}
                className="cursor-pointer focus:bg-zinc-800"
              >
                <Bell className="mr-2 size-4" />
                Alerts
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="cursor-pointer text-red-500 focus:bg-zinc-800 focus:text-red-500"
              >
                <LogOut className="mr-2 size-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
```

---

## File: /components/Dashboard.tsx

```tsx
import Header from './Header';
import MarketSummary from './MarketSummary';
import WatchlistCards from './WatchlistCards';
import TopStocks from './TopStocks';
import FinancialNews from './FinancialNews';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <MarketSummary />
            <TopStocks />
          </div>
          
          <div className="space-y-6">
            <WatchlistCards />
            <FinancialNews />
          </div>
        </div>
      </main>
    </div>
  );
}
```

---

## File: /components/MarketSummary.tsx

```tsx
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { date: 'Jan', sp500: 4200, nasdaq: 13000, dow: 33000, crypto: 1.8 },
  { date: 'Feb', sp500: 4350, nasdaq: 13400, dow: 33500, crypto: 2.1 },
  { date: 'Mar', sp500: 4450, nasdaq: 13800, dow: 34000, crypto: 2.3 },
  { date: 'Apr', sp500: 4300, nasdaq: 13200, dow: 33200, crypto: 1.9 },
  { date: 'May', sp500: 4500, nasdaq: 14000, dow: 34500, crypto: 2.5 },
  { date: 'Jun', sp500: 4600, nasdaq: 14200, dow: 35000, crypto: 2.7 },
  { date: 'Jul', sp500: 4750, nasdaq: 14600, dow: 35500, crypto: 2.9 },
];

const indices = [
  { name: 'S&P 500', value: '$4,750.89', change: '+1.2%', positive: true },
  { name: 'Nasdaq 100', value: '$14,612.45', change: '+1.8%', positive: true },
  { name: 'Dow Jones', value: '$35,438.12', change: '+0.9%', positive: true },
];

export default function MarketSummary() {
  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle>Market Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="indices" className="w-full">
          <TabsList className="bg-zinc-900 border-zinc-800">
            <TabsTrigger value="indices">Indices</TabsTrigger>
            <TabsTrigger value="stocks">Stocks</TabsTrigger>
            <TabsTrigger value="crypto">Crypto</TabsTrigger>
            <TabsTrigger value="forex">Forex</TabsTrigger>
            <TabsTrigger value="bonds">Bonds</TabsTrigger>
            <TabsTrigger value="etfs">ETFs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="indices" className="mt-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {indices.map((index) => (
                <div key={index.name} className="bg-black border border-zinc-800 rounded-lg p-4">
                  <p className="text-zinc-400 text-sm">{index.name}</p>
                  <p className="mt-1">{index.value}</p>
                  <p className={`text-sm mt-1 ${index.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {index.change}
                  </p>
                </div>
              ))}
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="sp500" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="stocks" className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="nasdaq" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="crypto" className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    border: '1px solid #27272a',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="crypto" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

---

## File: /components/WatchlistCards.tsx

```tsx
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Star } from 'lucide-react';

const watchlistStocks = [
  { symbol: 'AAPL', company: 'Apple Inc.', price: '$182.52', change: '+2.4%', positive: true, bg: 'bg-orange-500' },
  { symbol: 'NVDA', company: 'Netflix, Inc.', price: '$520.68', change: '+3.8%', positive: true, bg: 'bg-red-500' },
  { symbol: 'MSFT', company: 'Microsoft Corporation', price: '$405.04', change: '-1.2%', positive: false, bg: 'bg-blue-500' },
  { symbol: 'GOOGL', company: 'Alphabet Inc.', price: '$142.56', change: '+1.5%', positive: true, bg: 'bg-sky-500' },
  { symbol: 'AMZN', company: 'Amazon.com Corporation', price: '$145.04', change: '+0.8%', positive: true, bg: 'bg-orange-500' },
  { symbol: 'TSLA', company: 'Tesla, Inc.', price: '$218.12', change: '-2.3%', positive: false, bg: 'bg-red-500' },
];

export default function WatchlistCards() {
  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Watchlist</CardTitle>
        <button className="text-emerald-500 text-sm hover:underline">View All</button>
      </CardHeader>
      <CardContent className="space-y-3">
        {watchlistStocks.map((stock) => (
          <div 
            key={stock.symbol}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`${stock.bg} size-10 rounded-lg flex items-center justify-center`}>
                  <TrendingUp className="size-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>{stock.symbol}</span>
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <p className="text-sm text-zinc-400">{stock.company}</p>
                </div>
              </div>
              <div className="text-right">
                <p>{stock.price}</p>
                <p className={`text-sm ${stock.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stock.change}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

---

## File: /components/TopStocks.tsx

```tsx
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const stocks = [
  { company: 'Apple Inc.', symbol: 'AAPL', price: '$223.16', change: '+2.56%', positive: true, marketCap: '$3.48T', peRatio: '29.5' },
  { company: 'Microsoft Corp', symbol: 'MSFT', price: '$405.12', change: '-0.93%', positive: false, marketCap: '$3.03T', peRatio: '36.8' },
  { company: 'Alphabet Inc', symbol: 'GOOGL', price: '$140.14', change: '+3.87%', positive: true, marketCap: '$1.78T', peRatio: '24.9' },
  { company: 'Amazon.com Inc', symbol: 'AMZN', price: '$185.42', change: '+1.63%', positive: true, marketCap: '$1.91T', peRatio: '59.6' },
  { company: 'Tesla Inc', symbol: 'TSLA', price: '$242.62', change: '+1.73%', positive: true, marketCap: '$768B', peRatio: '81.2' },
  { company: 'Meta Platforms Inc', symbol: 'META', price: '$519.24', change: '-2.84%', positive: false, marketCap: '$1.36T', peRatio: '42.3' },
  { company: 'NVIDIA Corp', symbol: 'NVDA', price: '$487.63', change: '+2.84%', positive: true, marketCap: '$1.20T', peRatio: '66.7' },
  { company: 'Netflix Inc', symbol: 'NFLX', price: '$524.43', change: '-0.85%', positive: false, marketCap: '$224B', peRatio: '45.9' },
  { company: 'Oracle Corp', symbol: 'ORCL', price: '$124.63', change: '+3.88%', positive: true, marketCap: '$343B', peRatio: '37.2' },
  { company: 'Salesforce Inc', symbol: 'CRM', price: '$254.40', change: '-3.86%', positive: false, marketCap: '$242B', peRatio: '37.2' },
];

export default function TopStocks() {
  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Today's Top Stocks</CardTitle>
        <Button variant="ghost" className="text-emerald-500 hover:text-emerald-400 hover:bg-zinc-900">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 text-zinc-400">Company</th>
                <th className="text-left py-3 text-zinc-400">Symbol</th>
                <th className="text-right py-3 text-zinc-400">Price</th>
                <th className="text-right py-3 text-zinc-400">Change</th>
                <th className="text-right py-3 text-zinc-400">Market Cap</th>
                <th className="text-right py-3 text-zinc-400">P/E Ratio</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, index) => (
                <tr 
                  key={stock.symbol}
                  className={`border-b border-zinc-800 hover:bg-zinc-900 cursor-pointer transition-colors ${
                    index === stocks.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="py-4">{stock.company}</td>
                  <td className="py-4 text-zinc-400">{stock.symbol}</td>
                  <td className="py-4 text-right">{stock.price}</td>
                  <td className={`py-4 text-right ${stock.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stock.change}
                  </td>
                  <td className="py-4 text-right text-zinc-400">{stock.marketCap}</td>
                  <td className="py-4 text-right text-zinc-400">{stock.peRatio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## File: /components/FinancialNews.tsx

```tsx
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock } from 'lucide-react';

const newsItems = [
  {
    title: "Exclusive: Women's New Employee Perk Takes a Bite Out of Women's Grocery Bills",
    category: 'Top Stories',
    time: '30 minutes ago',
  },
  {
    title: "Stocks Plunge Today: Dow drops S&P 500 And Nasdaq record as third rate cut looms large",
    category: 'Local Impact',
    time: '18 hours ago',
  },
  {
    title: "Ex-Kroger CEO could reveal 'embarrassing details about its advanced grocery pricing' accord",
    category: 'Buzz Feed',
    time: '2 hours ago',
  },
];

export default function FinancialNews() {
  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Today's Financial News</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {newsItems.map((item, index) => (
          <div 
            key={index}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <div className="flex gap-2 mb-2">
              <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-0">
                {item.category}
              </Badge>
            </div>
            <h3 className="mb-3 line-clamp-2">{item.title}</h3>
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Clock className="size-4" />
              <span>{item.time}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

---

## File: /components/Search.tsx

```tsx
import { useState } from 'react';
import Header from './Header';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search as SearchIcon, TrendingUp, Star } from 'lucide-react';

interface SearchResult {
  symbol: string;
  company: string;
  price: string;
  change: string;
  positive: boolean;
  marketCap: string;
  peRatio: string;
  volume: string;
  description: string;
}

const mockResults: SearchResult[] = [
  {
    symbol: 'AAPL',
    company: 'Apple Inc.',
    price: '$182.52',
    change: '+2.4%',
    positive: true,
    marketCap: '$2.87T',
    peRatio: '29.5',
    volume: '52.3M',
    description: 'Technology company that designs and manufactures consumer electronics and software'
  },
  {
    symbol: 'MSFT',
    company: 'Microsoft Corporation',
    price: '$405.04',
    change: '-1.2%',
    positive: false,
    marketCap: '$3.01T',
    peRatio: '36.8',
    volume: '23.1M',
    description: 'Develops, licenses, and supports software, services, devices, and solutions'
  },
  {
    symbol: 'GOOGL',
    company: 'Alphabet Inc.',
    price: '$142.56',
    change: '+1.5%',
    positive: true,
    marketCap: '$1.79T',
    peRatio: '26.3',
    volume: '28.4M',
    description: 'Global technology company focused on search, advertising, and cloud computing'
  },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (query.trim()) {
      setResults(mockResults);
      setSearched(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="mb-6">Stock Search</h1>
          
          <div className="flex gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-5 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search for stocks, ETFs, or companies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 bg-zinc-950 border-zinc-800 h-12"
              />
            </div>
            <Button 
              onClick={handleSearch}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-8"
            >
              Search
            </Button>
          </div>
        </div>

        {searched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2>Search Results</h2>
              <p className="text-zinc-400">{results.length} results found</p>
            </div>

            {results.map((result) => (
              <Card key={result.symbol} className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="bg-zinc-900 size-12 rounded-lg flex items-center justify-center">
                          <TrendingUp className="size-6 text-emerald-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3>{result.symbol}</h3>
                            <button className="text-zinc-400 hover:text-yellow-500 transition-colors">
                              <Star className="size-5" />
                            </button>
                          </div>
                          <p className="text-zinc-400">{result.company}</p>
                        </div>
                      </div>
                      
                      <p className="text-zinc-400 text-sm mb-4">{result.description}</p>
                      
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-zinc-400 text-sm mb-1">Price</p>
                          <p>{result.price}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-sm mb-1">Change</p>
                          <p className={result.positive ? 'text-emerald-500' : 'text-red-500'}>
                            {result.change}
                          </p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-sm mb-1">Market Cap</p>
                          <p>{result.marketCap}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-sm mb-1">P/E Ratio</p>
                          <p>{result.peRatio}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                        Add to Watchlist
                      </Button>
                      <Button variant="outline" className="border-zinc-700 hover:bg-zinc-900">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!searched && (
          <Card className="bg-zinc-950 border-zinc-800">
            <CardContent className="p-12 text-center">
              <SearchIcon className="size-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400">Start searching for stocks to see results</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
```

---

## File: /components/Watchlist.tsx

```tsx
import Header from './Header';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Star, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';

interface WatchlistItem {
  company: string;
  symbol: string;
  price: string;
  change: string;
  marketCap: string;
  peRatio: string;
  alert: string;
}

const watchlistData: WatchlistItem[] = [
  {
    company: 'Apple Inc.',
    symbol: 'AAPL',
    price: '$182.52',
    change: '+2.4%',
    marketCap: '$2.87T',
    peRatio: '29.5',
    alert: 'Above $180'
  },
  {
    company: 'Microsoft Corporation',
    symbol: 'MSFT',
    price: '$405.04',
    change: '-1.2%',
    marketCap: '$3.01T',
    peRatio: '36.8',
    alert: 'Below $400'
  },
  {
    company: 'Alphabet Inc.',
    symbol: 'GOOGL',
    price: '$142.56',
    change: '+1.5%',
    marketCap: '$1.79T',
    peRatio: '26.3',
    alert: 'None'
  },
  {
    company: 'Amazon.com Inc.',
    symbol: 'AMZN',
    price: '$145.04',
    change: '+0.8%',
    marketCap: '$1.49T',
    peRatio: '71.2',
    alert: 'Above $150'
  },
  {
    company: 'Tesla Inc.',
    symbol: 'TSLA',
    price: '$218.12',
    change: '-2.3%',
    marketCap: '$691B',
    peRatio: '73.5',
    alert: 'Below $200'
  },
  {
    company: 'NVIDIA Corporation',
    symbol: 'NVDA',
    price: '$487.63',
    change: '+3.2%',
    marketCap: '$1.20T',
    peRatio: '66.7',
    alert: 'Above $500'
  },
  {
    company: 'Meta Platforms Inc.',
    symbol: 'META',
    price: '$342.56',
    change: '+1.8%',
    marketCap: '$883B',
    peRatio: '28.4',
    alert: 'None'
  },
  {
    company: 'Netflix Inc.',
    symbol: 'NFLX',
    price: '$524.43',
    change: '-0.9%',
    marketCap: '$224B',
    peRatio: '45.9',
    alert: 'Above $520'
  },
];

export default function Watchlist() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="mb-2">My Watchlist</h1>
            <p className="text-zinc-400">Track and monitor your favorite stocks</p>
          </div>
          <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
            Add Stock
          </Button>
        </div>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle>Watchlist Stocks ({watchlistData.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-4 text-zinc-400"></th>
                    <th className="text-left py-4 text-zinc-400">Company</th>
                    <th className="text-left py-4 text-zinc-400">Symbol</th>
                    <th className="text-right py-4 text-zinc-400">Price</th>
                    <th className="text-right py-4 text-zinc-400">Change</th>
                    <th className="text-right py-4 text-zinc-400">Market Cap</th>
                    <th className="text-right py-4 text-zinc-400">P/E Ratio</th>
                    <th className="text-left py-4 text-zinc-400">Alert</th>
                    <th className="text-center py-4 text-zinc-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlistData.map((item, index) => {
                    const isPositive = item.change.startsWith('+');
                    return (
                      <tr 
                        key={item.symbol}
                        className={`border-b border-zinc-800 hover:bg-zinc-900 transition-colors ${
                          index === watchlistData.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="py-4">
                          <Star className="size-5 text-yellow-500 fill-yellow-500" />
                        </td>
                        <td className="py-4">{item.company}</td>
                        <td className="py-4 text-zinc-400">{item.symbol}</td>
                        <td className="py-4 text-right">{item.price}</td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isPositive ? (
                              <TrendingUp className="size-4 text-emerald-500" />
                            ) : (
                              <TrendingDown className="size-4 text-red-500" />
                            )}
                            <span className={isPositive ? 'text-emerald-500' : 'text-red-500'}>
                              {item.change}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-right text-zinc-400">{item.marketCap}</td>
                        <td className="py-4 text-right text-zinc-400">{item.peRatio}</td>
                        <td className="py-4">
                          {item.alert !== 'None' ? (
                            <span className="text-yellow-500">{item.alert}</span>
                          ) : (
                            <span className="text-zinc-600">{item.alert}</span>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-emerald-500 hover:text-emerald-400 hover:bg-zinc-800"
                            >
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-red-500 hover:text-red-400 hover:bg-zinc-800"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

---

## File: /components/Profile.tsx

```tsx
import { useState } from 'react';
import Header from './Header';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';

export default function Profile() {
  const [formData, setFormData] = useState({
    fullName: 'adaup tafara matinya',
    email: 'adaup35@hotmail.com',
    country: 'hu',
    investmentGoals: 'growth',
    riskTolerance: 'medium',
    preferredIndustry: 'technology',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle profile update
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="mb-2">Profile</h1>
          <p className="text-zinc-400">Manage your account settings and preferences</p>
        </div>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-black border-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-black border-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select 
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger className="bg-black border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">🇺🇸 United States</SelectItem>
                    <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                    <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                    <SelectItem value="hu">🇭🇺 Hungary</SelectItem>
                    <SelectItem value="de">🇩🇪 Germany</SelectItem>
                    <SelectItem value="fr">🇫🇷 France</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-zinc-500">Helps us show relevant data and news relevant to you.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="investmentGoals">Investment Goals</Label>
                <Select 
                  value={formData.investmentGoals}
                  onValueChange={(value) => setFormData({ ...formData, investmentGoals: value })}
                >
                  <SelectTrigger className="bg-black border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="preservation">Capital Preservation</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                <Select 
                  value={formData.riskTolerance}
                  onValueChange={(value) => setFormData({ ...formData, riskTolerance: value })}
                >
                  <SelectTrigger className="bg-black border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredIndustry">Preferred Industry</Label>
                <Select 
                  value={formData.preferredIndustry}
                  onValueChange={(value) => setFormData({ ...formData, preferredIndustry: value })}
                >
                  <SelectTrigger className="bg-black border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="energy">Energy</SelectItem>
                    <SelectItem value="consumer">Consumer Goods</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

---

## File: /components/Alerts.tsx

```tsx
import { useState } from 'react';
import Header from './Header';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell, BellOff, Trash2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface Alert {
  id: string;
  symbol: string;
  company: string;
  condition: string;
  value: string;
  active: boolean;
  triggered: boolean;
  createdAt: string;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    symbol: 'AAPL',
    company: 'Apple Inc.',
    condition: 'Above',
    value: '$180.00',
    active: true,
    triggered: true,
    createdAt: '2 hours ago'
  },
  {
    id: '2',
    symbol: 'MSFT',
    company: 'Microsoft Corporation',
    condition: 'Below',
    value: '$400.00',
    active: true,
    triggered: true,
    createdAt: '1 day ago'
  },
  {
    id: '3',
    symbol: 'GOOGL',
    company: 'Alphabet Inc.',
    condition: 'Above',
    value: '$145.00',
    active: true,
    triggered: false,
    createdAt: '3 days ago'
  },
  {
    id: '4',
    symbol: 'TSLA',
    company: 'Tesla Inc.',
    condition: 'Below',
    value: '$200.00',
    active: false,
    triggered: false,
    createdAt: '1 week ago'
  },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [isOpen, setIsOpen] = useState(false);

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, active: !alert.active } : alert
    ));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="mb-2">Price Alerts</h1>
            <p className="text-zinc-400">Manage your stock price notifications</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                <Plus className="mr-2 size-4" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800">
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Set up a price alert for a stock in your watchlist
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Symbol</Label>
                  <Input
                    id="stock"
                    placeholder="e.g., AAPL"
                    className="bg-black border-zinc-800"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select>
                    <SelectTrigger className="bg-black border-zinc-800">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                      <SelectItem value="change-percent">% Change</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="value">Target Value</Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="e.g., 180.00"
                    className="bg-black border-zinc-800"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  className="border-zinc-700 hover:bg-zinc-900"
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  onClick={() => setIsOpen(false)}
                >
                  Create Alert
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle>Active Alerts ({alerts.filter(a => a.active).length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.filter(a => a.active).map((alert) => (
                  <div 
                    key={alert.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Bell className="size-5 text-yellow-500" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{alert.symbol}</span>
                              {alert.triggered && (
                                <Badge className="bg-red-500 text-white border-0">Triggered</Badge>
                              )}
                            </div>
                            <p className="text-sm text-zinc-400">{alert.company}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <p className="text-zinc-400">
                            Alert when price is <span className="text-white">{alert.condition}</span> {alert.value}
                          </p>
                          <span className="text-zinc-600">•</span>
                          <p className="text-zinc-500">{alert.createdAt}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleAlert(alert.id)}
                          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                          <BellOff className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteAlert(alert.id)}
                          className="text-red-500 hover:text-red-400 hover:bg-zinc-800"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {alerts.filter(a => !a.active).length > 0 && (
            <Card className="bg-zinc-950 border-zinc-800">
              <CardHeader>
                <CardTitle>Inactive Alerts ({alerts.filter(a => !a.active).length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.filter(a => !a.active).map((alert) => (
                    <div 
                      key={alert.id}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 opacity-60"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <BellOff className="size-5 text-zinc-600" />
                            <div>
                              <span>{alert.symbol}</span>
                              <p className="text-sm text-zinc-400">{alert.company}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <p className="text-zinc-400">
                              Alert when price is <span className="text-white">{alert.condition}</span> {alert.value}
                            </p>
                            <span className="text-zinc-600">•</span>
                            <p className="text-zinc-500">{alert.createdAt}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleAlert(alert.id)}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                          >
                            <Bell className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteAlert(alert.id)}
                            className="text-red-500 hover:text-red-400 hover:bg-zinc-800"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
```

---

## Dependencies Required

Install these packages in your project:

```bash
npm install react-router-dom recharts lucide-react
```

## Shadcn UI Components Required

```bash
npx shadcn@latest add button card input label select dropdown-menu avatar badge tabs dialog
```

---

## Design System

### Colors
- **Background**: `bg-black` (#000000)
- **Cards**: `bg-zinc-950` (#09090b)
- **Borders**: `border-zinc-800` (#27272a)
- **Primary text**: `text-white`
- **Secondary text**: `text-zinc-400` (#a1a1aa)
- **Brand color**: `text-emerald-500` (#10b981)
- **CTA buttons**: `bg-yellow-500` (#eab308)
- **Positive values**: `text-emerald-500`
- **Negative values**: `text-red-500`

### Typography
- All font sizes, weights, and line-heights are handled by the default globals.css
- Do not add font-size, font-weight, or line-height classes unless specifically needed

### Brand
- **Name**: Marketimi
- **Logo**: TrendingUp icon (lucide-react) in emerald-500

---

## File Structure

```
/src
  /components
    - SignIn.tsx
    - SignUp.tsx
    - Header.tsx
    - Dashboard.tsx
    - MarketSummary.tsx
    - WatchlistCards.tsx
    - TopStocks.tsx
    - FinancialNews.tsx
    - Search.tsx
    - Watchlist.tsx
    - Profile.tsx
    - Alerts.tsx
    /ui (shadcn components)
      - button.tsx
      - card.tsx
      - input.tsx
      - label.tsx
      - select.tsx
      - dropdown-menu.tsx
      - avatar.tsx
      - badge.tsx
      - tabs.tsx
      - dialog.tsx
  - App.tsx
```

---

## Implementation Notes

1. The app uses React Router for navigation
2. Authentication is handled with a simple useState boolean (replace with real auth later)
3. All data is currently mocked - replace with API calls
4. The watchlist table matches your exact field requirements:
   - company (or symbol if company not available)
   - symbol
   - price
   - change
   - marketCap
   - peRatio
   - alert
   - action (View button)
5. Dark mode is the default and only theme
6. All components use TypeScript with proper interfaces
7. Responsive design is built-in with Tailwind grid and flex utilities
