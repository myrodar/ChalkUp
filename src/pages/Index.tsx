import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import "@/styles/ticker.css";
import {
  ChevronRight,
  Award,
  Mountain,
  ArrowRight,
  Users,
  Calendar,
  Mail,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import Navbar from "@/components/Navbar";

// Define custom SVG components first to avoid "used before declaration" errors
const Chart = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
    <polyline points="7.5 19.79 7.5 14.6 3 12" />
    <polyline points="21 12 16.5 14.6 16.5 19.79" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const Map = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Demo stats
  const stats = [
    { value: '200+', label: 'Climbers' },
    { value: '25', label: 'Boulders' },
    { value: '5', label: 'Universities' },
    { value: '1', label: 'Day' },
  ];

  // Features for the carousel
  const features = [
    {
      title: "Track Your Progress",
      description: "Log your climbs and see your improvement over time with detailed statistics and progress charts.",
      icon: <Chart className="h-8 w-8 text-primary" />
    },
    {
      title: "Compete with Friends",
      description: "Challenge your friends and fellow climbers with real-time leaderboards and competitions.",
      icon: <Users className="h-8 w-8 text-primary" />
    },
    {
      title: "Log points easily",
      description: "Log your climbs easily with our point system and detailed statistics.",
      icon: <Map className="h-8 w-8 text-primary" />
    },
  ];



  useEffect(() => {
    // Check if user is logged in from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      setIsLoggedIn(true);
      setUserName(userData.name);
    }

    // Feature carousel auto-rotation
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [features.length]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserName('');
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
  };



  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  // Parallax effect for hero section
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Dynamic background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        {/* Animated climbing holds pattern */}
        <div className="absolute w-full h-full opacity-5">
          <svg viewBox="0 0 100 100" className="absolute top-0 left-0 w-full h-full">
            <pattern id="climbing-holds" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="2" fill="currentColor" />
              <path d="M5,5 L15,15 M15,5 L5,15" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#climbing-holds)" />
          </svg>
        </div>

        {/* Animated gradients */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDuration: '8s', animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 left-1/4 w-1/4 h-1/4 bg-gradient-to-tr from-violet-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDuration: '12s', animationDelay: '4s'}}></div>
      </div>

      <Navbar
        isLoggedIn={isLoggedIn}
        userName={userName}
        onLogout={handleLogout}
        theme="dark"
      />

      <main className="relative">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
          {/* Parallax climbing wall background */}
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-center"
            style={{
              backgroundImage: 'url("/images/climbing-wall-texture.jpg")',
              transform: `translateY(${scrollY * 0.15}px)`,
            }}
          ></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-12 pb-32">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              {/* Left side: Text content */}
              <div>
                <motion.div variants={itemVariants} className="inline-flex mb-6 items-center px-3 py-1 rounded-full bg-primary/20 border border-primary/20 backdrop-blur-sm">
                  <span className="text-xs font-medium tracking-wider text-primary uppercase">Compétition BlocShop</span>
                </motion.div>

                <motion.h1
                  variants={itemVariants}
                  className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
                >
                  <span className="block">Challenge</span>
                  <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Your Limits</span>
                </motion.h1>

                <motion.p
                  variants={itemVariants}
                  className="text-lg text-gray-300 mb-8 max-w-lg"
                >
                  Join Montreal's premier inter-university climbing competition and push your boundaries. Track progress, compete with friends, and become part of our climbing community.
                </motion.p>

                <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                  {isLoggedIn ? (
                    <Button
                      size="lg"
                      onClick={() => navigate('/dashboard')}
                      className="group bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 shadow-lg hover:shadow-primary/20 transition-all duration-300"
                    >
                      View Your Progress
                      <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={() => navigate('/auth')}
                      className="group bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 shadow-lg hover:shadow-primary/20 transition-all duration-300"
                    >
                      Join Competition
                      <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/leaderboard')}
                    className="gap-2 backdrop-blur-sm bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <Award className="h-5 w-5" />
                    View Leaderboard
                  </Button>
                </motion.div>

                {/* Date and Location */}
                <motion.div
                  variants={itemVariants}
                  className="mt-12 flex flex-col sm:flex-row sm:items-center gap-6"
                >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-primary mr-2" />
                    <span className="text-sm">April 18, 2025</span>
                  </div>
                  <div className="flex items-center">
                    <Map className="h-5 w-5 text-primary mr-2" />
                    <span className="text-sm">BlocShop Hochelaga, Montreal</span>
                  </div>
                </motion.div>
              </div>

              {/* Right side: Interactive 3D render */}
              <motion.div
                variants={itemVariants}
                className="relative aspect-square max-w-lg mx-auto"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Circular rotating element */}
                  <div className="relative w-full h-full">
                    {/* Large outer circle - slow rotation */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-2 border-dashed border-primary/20 rounded-full"
                    ></motion.div>

                    {/* Medium circle - medium rotation */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-8 border border-primary/30 rounded-full"
                    ></motion.div>

                    {/* Small inner circle - faster rotation */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-16 border border-primary/40 rounded-full"
                    ></motion.div>

                    {/* Center static element */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3/4 h-3/4 rounded-full bg-gradient-radial from-primary/10 to-transparent flex items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          className="relative w-1/2 h-1/2"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600 rounded-full opacity-30 blur-xl"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Mountain className="h-16 w-16 text-white" />
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {/* Orbiting elements */}
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                      <motion.div
                        key={i}
                        initial={{ rotate: angle }}
                        animate={{ rotate: angle + 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <motion.div
                          className="absolute rounded-lg bg-gradient-to-r from-primary to-blue-600 p-1 shadow-lg"
                          style={{ left: '85%' }}
                          whileHover={{ scale: 1.2 }}
                        >
                          <div className="w-3 h-3 rounded-sm bg-white/90"></div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Stats counter section */}
          <div className="absolute bottom-0 left-0 right-0 w-full backdrop-blur-lg bg-slate-900/50 py-8 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, staggerChildren: 0.1 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 md:grid-cols-4 gap-8"
              >
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center"
                  >
                    <motion.p
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                      viewport={{ once: true }}
                      className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent"
                    >
                      {stat.value}
                    </motion.p>
                    <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Showcase */}
        <section className="py-24 relative overflow-hidden" id="features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Experience the Future of <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Climbing Competitions</span></h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">ChalkUp brings innovative tools to climbers and competition organizers alike.</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left side - Feature Carousel */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-xl relative overflow-hidden"
              >
                {/* Background accents */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full"></div>

                <div className="relative h-96">
                  <AnimatePresence mode="wait">
                    {features.map((feature, index) => (
                      activeFeature === index && (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
                        >
                          <div className="p-3 bg-slate-800 rounded-2xl mb-6">
                            {feature.icon}
                          </div>
                          <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                          <p className="text-gray-400">{feature.description}</p>
                        </motion.div>
                      )
                    ))}
                  </AnimatePresence>
                </div>

                {/* Navigation dots */}
                <div className="flex justify-center space-x-2 mt-4">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveFeature(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        activeFeature === index ? 'w-8 bg-primary' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Right side - App Screenshot */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Decorative elements */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full max-w-md mx-auto">
                    {/* Phone frame */}
                    <div className="relative rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden aspect-[9/19] mx-auto">
                      {/* App screenshot placeholder */}
                      <div className="absolute inset-0 bg-slate-900">
                        {/* App UI mockup */}
                        <div className="flex flex-col h-full">
                          {/* App header */}
                          <div className="p-4 bg-slate-800 flex items-center justify-between">
                            <div className="flex items-center">
                              <Mountain className="h-5 w-5 text-primary mr-2" />
                              <span className="font-medium text-sm">ChalkUp</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-700"></div>
                          </div>

                          {/* App content */}
                          <div className="flex-1 p-4 relative">
                            {/* Title */}
                            <div className="mb-4">
                              <h4 className="text-sm font-bold">Leaderboard</h4>
                              <p className="text-xs text-gray-400">BlocShop Competition</p>
                            </div>

                            {/* Leaderboard entries */}
                            {[1, 2, 3, 4, 5].map((pos) => (
                              <motion.div
                                key={pos}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 + pos * 0.1 }}
                                className={`flex items-center p-2 rounded-lg mb-2 ${
                                  pos === 1 ? 'bg-primary/20 border border-primary/30' : 'bg-slate-700/50'
                                }`}
                              >
                                <div className="font-bold mr-3 text-sm">{pos}</div>
                                <div className="w-6 h-6 rounded-full bg-slate-600 mr-2"></div>
                                <div className="flex-1">
                                  <div className="text-xs font-medium">Climber {pos}</div>
                                  <div className="text-xs text-gray-400">McGill University</div>
                                </div>
                                <div className="text-sm font-bold">
                                  {600 - pos * 50} pts
                                </div>
                              </motion.div>
                            ))}
                          </div>

                          {/* App navigation */}
                          <div className="p-4 bg-slate-800 flex items-center justify-around">
                            <button className="p-2 text-primary">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                              </svg>
                            </button>
                            <button className="p-2">
                              <Award className="h-5 w-5" />
                            </button>
                            <button className="p-2">
                              <Users className="h-5 w-5" />
                            </button>
                            <button className="p-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20v-6M6 20V10M18 20V4"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating decorative elements */}
                    <div className="absolute top-1/4 -right-4 w-16 h-16 bg-gradient-to-br from-primary to-blue-500 rounded-2xl blur-lg opacity-60 animate-pulse"></div>
                    <div className="absolute bottom-1/4 -left-4 w-12 h-12 bg-gradient-to-tr from-violet-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>



        {/* Timeline Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Competition <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Timeline</span></h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">Mark your calendar and get ready for an amazing climbing experience.</p>
            </motion.div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary via-blue-500 to-violet-500 rounded-full"></div>

              {/* Timeline events */}
              {[
                {
                  date: "April 18",
                  time: "11:45 AM - 14:15 PM",
                  title: "Vague 1",
                  description: "All participants will attempt qualification problems to determine seeding for the finals."
                },
                {
                  date: "April 18",
                  time: "14:30 PM - 17:00 PM",
                  title: "Vague 2",
                  description: "Second round of qualification problems."
                },
                {
                  date: "April 18",
                  time: "18h30 PM - 20:00 PM",
                  title: "Finals!!",
                  description: "Top 6 climbers compete in the finals."
                }
              ].map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex items-center justify-center mb-12 ${
                    i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Date circle */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-500 flex flex-col items-center justify-center text-white z-20">
                      <span className="text-xs font-semibold">{event.date}</span>
                    </div>
                    <div className="absolute w-20 h-20 rounded-full border-2 border-primary/30 animate-ping"></div>
                  </div>

                  {/* Content card */}
                  <div className={`md:w-1/3 bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-xl ${
                    i % 2 === 0 ? 'md:ml-8' : 'md:mr-8'
                  }`}>
                    <div className="text-sm text-primary mb-2">{event.time}</div>
                    <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                    <p className="text-gray-400">{event.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Sponsors Section */}
        <section className="py-24 relative overflow-hidden bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Sponsors</span></h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">Thank you to all our partners who make this competition possible.</p>
            </motion.div>

            {/* Sponsors Ticker Carousel */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative my-12 overflow-hidden"
            >
              {/* Horizontal ticker carousel - CSS-based for smoother animation */}
              <div className="relative w-full py-8">
                {/* Single ticker row */}
                <div className="ticker-container w-full">
                  <div className="ticker">
                    {/* First set of logos */}
                    <div className="ticker-content flex">
                      {[
                        { name: "BlocShop", src: "/sponsors/blocshop.png" },
                        { name: "Mate Libre", src: "/sponsors/MateLibre_Logo_NOIR 2.png" },
                        { name: "Sponsor 1", src: "/sponsors/IMG_9456.png" },
                        { name: "Sponsor 2", src: "/sponsors/image__1_-removebg-preview.png" },
                        { name: "Placeholder 1", src: "/sponsors/placeholder.svg" },
                        { name: "Placeholder 2", src: "/sponsors/placeholder.svg" }
                      ].map((sponsor, i) => (
                        <div
                          key={`ticker-${i}`}
                          className="flex-shrink-0 w-64 h-32 mx-4 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6 flex items-center justify-center hover:bg-white/15 transition-all duration-300"
                        >
                          <img
                            src={sponsor.src}
                            alt={sponsor.name}
                            className="max-h-20 max-w-full object-contain filter brightness-0 invert opacity-90 hover:opacity-100 transition-all duration-300"
                          />
                        </div>
                      ))}
                    </div>
                    {/* Duplicate for seamless loop */}
                    <div className="ticker-content flex">
                      {[
                        { name: "BlocShop", src: "/sponsors/blocshop.png" },
                        { name: "Mate Libre", src: "/sponsors/MateLibre_Logo_NOIR 2.png" },
                        { name: "Sponsor 1", src: "/sponsors/IMG_9456.png" },
                        { name: "Sponsor 2", src: "/sponsors/image__1_-removebg-preview.png" },
                        { name: "Placeholder 1", src: "/sponsors/placeholder.svg" },
                        { name: "Placeholder 2", src: "/sponsors/placeholder.svg" }
                      ].map((sponsor, i) => (
                        <div
                          key={`ticker-dup-${i}`}
                          className="flex-shrink-0 w-64 h-32 mx-4 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-6 flex items-center justify-center hover:bg-white/15 transition-all duration-300"
                        >
                          <img
                            src={sponsor.src}
                            alt={sponsor.name}
                            className="max-h-20 max-w-full object-contain filter brightness-0 invert opacity-90 hover:opacity-100 transition-all duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Animation is handled via CSS classes in global styles */}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative rounded-3xl overflow-hidden"
            >
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-blue-600/20 to-violet-600/30 backdrop-blur-xl"></div>

              {/* Animated particles */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-white/30"
                    animate={{
                      x: [
                        Math.floor(Math.random() * 100) + "%",
                        Math.floor(Math.random() * 100) + "%"
                      ],
                      y: [
                        Math.floor(Math.random() * 100) + "%",
                        Math.floor(Math.random() * 100) + "%"
                      ],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: Math.floor(Math.random() * 10) + 10,
                      repeat: Infinity,
                      delay: Math.random() * 5
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 py-16 px-8 text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-3xl md:text-5xl font-bold mb-6"
                >
                  Ready to Join the <span className="bg-gradient-to-r from-white to-primary/80 bg-clip-text text-transparent">Competition</span>?
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="text-lg text-white/90 max-w-2xl mx-auto mb-8"
                >
                  Register now to secure your spot at Montreal's premier inter-university climbing competition.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Button
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className="bg-white text-slate-900 hover:bg-white/90 shadow-lg transition-all duration-300"
                  >
                    Register Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/rules')}
                    className="border-white text-white hover:bg-white/10 transition-all duration-300"
                  >
                    Learn More
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-gradient-to-r from-slate-950 to-slate-900 text-white py-16 relative overflow-hidden">
        {/* Background patterns */}
        <div className="absolute inset-0 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" className="w-full h-full">
            <g fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M0,50 L400,50 M0,150 L400,150 M0,250 L400,250 M0,350 L400,350" />
              <path d="M50,0 L50,400 M150,0 L150,400 M250,0 L250,400 M350,0 L350,400" />
            </g>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Logo + Copyright */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 pb-12 border-b border-white/10">
            <div className="flex items-center mb-6 md:mb-0">
              <Mountain className="h-8 w-8 text-primary mr-2" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">ChalkUp</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
              <div className="flex space-x-6">
                <a href="#" aria-label="Message" className="text-gray-400 hover:text-primary transition-colors">
                  <MessageSquare className="h-5 w-5" />
                </a>
                <a href="#" aria-label="Website" className="text-gray-400 hover:text-primary transition-colors">
                  <ExternalLink className="h-5 w-5" />
                </a>
                <a href="#" aria-label="Email" className="text-gray-400 hover:text-primary transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              </div>

              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} {t('allRightsReserved')}
              </p>
            </div>
          </div>

          {/* Links in columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            {/* First column: About */}
            <div>
              <h3 className="font-semibold mb-4 text-primary">About ChalkUp</h3>
              <p className="text-sm text-gray-400 mb-4">ChalkUp is the premier platform for organizing and participating in climbing competitions across Canada.</p>
              <a
                href="/about"
                className="text-sm text-primary hover:text-primary/80 transition flex items-center"
              >
                Learn more
                <ChevronRight className="h-4 w-4 ml-1" />
              </a>
            </div>

            {/* Second column: Clubs */}
            <div>
              <h3 className="font-semibold mb-4 text-primary">{t('participatingClubs')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://www.mcgill.ca/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-primary transition-colors flex items-center"
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    McGill University
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.concordia.ca/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-primary transition-colors flex items-center"
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    Concordia University
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.polymtl.ca/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-primary transition-colors flex items-center"
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    Polytechnique Montréal
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-primary transition-colors flex items-center"
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    ETS
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-primary transition-colors flex items-center"
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    Université de Montréal
                  </a>
                </li>
              </ul>
            </div>

            {/* Third column: Competition */}
            <div>
              <h3 className="font-semibold mb-4 text-primary">{t('moreDetails')}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="/rules"
                    className="text-gray-300 hover:text-primary transition-colors flex items-center"
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {t('competitionRules')}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-primary transition-colors flex items-center"
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {t('scoringSystem')}
                  </a>
                </li>
                <li>
                  <a
                    href="/schedule"
                    className="text-gray-300 hover:text-primary transition-colors flex items-center"
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {t('schedule')}
                  </a>
                </li>
                <li>
                  <a
                    href="/prizes"
                    className="text-gray-300 hover:text-primary transition-colors flex items-center"
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    Prizes
                  </a>
                </li>
                <li>
                  <a
                    href="/faq"
                    className="text-gray-300 hover:text-primary transition-colors flex items-center"
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Fourth column: Contact */}
            <div>
              <h3 className="font-semibold mb-4 text-primary">{t('contactUs')}</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  <span className="text-gray-300">+1 (438) 494-2736</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <span className="text-gray-300">info@chalkup.com</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                  <span className="text-gray-300">BlocShop Chabanel<br />5455 Av. de Gaspé<br />Montreal, QC</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom text with links */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-white/10 text-xs text-gray-500">
            <div className="mb-4 md:mb-0">
              Designed with ❤️ for the climbing community
            </div>
            <div className="flex space-x-6">
              <a href="/privacy" className="hover:text-gray-300">Privacy Policy</a>
              <a href="/terms" className="hover:text-gray-300">Terms of Service</a>
              <a href="/cookies" className="hover:text-gray-300">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: scrollY > 300 ? 1 : 0 }}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all duration-300"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7"/>
        </svg>
      </motion.button>
    </div>
  );
};

export default Index;