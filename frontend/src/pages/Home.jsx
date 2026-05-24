import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Globe, Zap, BarChart3, Shield, Users, Smartphone } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <Globe size={32} />,
      title: 'Global Coverage',
      description: '150+ countries with localized cost data for accurate deployment planning'
    },
    {
      icon: <Zap size={32} />,
      title: 'AI-Powered Planning',
      description: 'Intelligent tower placement and route optimization for telecom projects'
    },
    {
      icon: <BarChart3 size={32} />,
      title: 'Cost Analytics',
      description: 'Real-time cost breakdown with accurate budget forecasting'
    },
    {
      icon: <Shield size={32} />,
      title: 'Secure Approvals',
      description: 'Company-based project approval system with transparent cost management'
    },
    {
      icon: <Users size={32} />,
      title: 'Team Collaboration',
      description: 'Multi-role workspace for developers, companies, and customers'
    },
    {
      icon: <Smartphone size={32} />,
      title: 'Mobile Optimized',
      description: 'Access your projects on-the-go with responsive design'
    }
  ];

  const countries = [
    { flag: '🇮🇳', name: 'India', currency: 'INR' },
    { flag: '🇺🇸', name: 'United States', currency: 'USD' },
    { flag: '🇬🇧', name: 'United Kingdom', currency: 'GBP' },
    { flag: '🇯🇵', name: 'Japan', currency: 'JPY' },
    { flag: '🇨🇳', name: 'China', currency: 'CNY' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-900 via-purple-900 to-lavender-900">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-black/10 border-b border-lavender-400/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lavender-300 to-purple-300">
            CostraSphere
          </div>
          <div className="space-x-4">
            <Link to="/login" className="px-6 py-2 text-lavender-100 hover:text-lavender-50 transition">
              Login
            </Link>
            <Link to="/register" className="px-6 py-2 bg-gradient-to-r from-purple-500 to-lavender-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition">
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div 
          className="text-center space-y-6 mb-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-lavender-200 via-purple-200 to-lavender-200 leading-tight"
            variants={itemVariants}
          >
            Telecom Infrastructure Planning Made Simple
          </motion.h1>
          <motion.p 
            className="text-xl text-lavender-200 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            AI-powered platform for calculating costs, planning tower deployments, and managing telecom infrastructure projects across the globe.
          </motion.p>
          <motion.div 
            className="flex gap-4 justify-center pt-4"
            variants={itemVariants}
          >
            <Link to="/register" className="px-8 py-3 bg-gradient-to-r from-purple-500 to-lavender-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition">
              Get Started
            </Link>
            <Link to="/login" className="px-8 py-3 border-2 border-lavender-400 text-lavender-200 rounded-lg font-medium hover:bg-lavender-400/10 transition">
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.h2 
          className="text-4xl font-bold text-center text-lavender-100 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Powerful Features
        </motion.h2>
        <motion.div 
          className="grid md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              className="glass p-8 rounded-2xl hover:border-purple-400/50 transition duration-300 group"
              variants={itemVariants}
              whileHover={{ y: -8 }}
            >
              <div className="text-purple-300 group-hover:text-lavender-300 transition mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-lavender-100 mb-2">{feature.title}</h3>
              <p className="text-lavender-300 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Supported Countries */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.h2 
          className="text-4xl font-bold text-center text-lavender-100 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Supported Countries
        </motion.h2>
        <motion.div 
          className="grid md:grid-cols-5 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {countries.map((country, idx) => (
            <motion.div
              key={idx}
              className="glass p-6 rounded-xl text-center hover:border-purple-400/50 transition"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-5xl mb-3">{country.flag}</div>
              <h3 className="text-lavender-100 font-medium mb-1">{country.name}</h3>
              <p className="text-purple-300 text-sm font-mono">{country.currency}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          className="glass p-12 rounded-2xl border border-purple-400/30 text-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-lavender-100">Ready to plan your infrastructure?</h2>
          <p className="text-lavender-200 max-w-xl mx-auto">Join thousands of companies using CostraSphere for accurate, AI-powered telecom planning</p>
          <Link to="/register" className="inline-block px-8 py-3 bg-gradient-to-r from-purple-500 to-lavender-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/50 transition">
            Create Account
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-lavender-400/20 mt-20 py-8 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 text-center text-lavender-300 text-sm">
          <p>© 2026 CostraSphere. All rights reserved. | Telecom Infrastructure Planning Platform</p>
        </div>
      </footer>
    </div>
  );
}
