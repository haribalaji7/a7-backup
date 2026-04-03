"use client";
import { useState } from "react";
import { Phone, PhoneCall, Clock, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import AgentCallModal from "@/components/helpline/AgentCallModal";

const emergencyServices = [
  { name: "Police", number: "100", color: "bg-blue-500", icon: "🚔" },
  { name: "Ambulance", number: "102 / 108", color: "bg-red-500", icon: "🚑" },
  { name: "Fire", number: "101", color: "bg-orange-500", icon: "🚒" },
  { name: "Emergency", number: "112", color: "bg-purple-500", icon: "🆘" },
];

const helplines = [
  {
    category: "Agriculture",
    icon: "🌾",
    color: "green",
    contacts: [
      { label: "Kisan Call Center", number: "1800-180-1551", available: "24/7" },
      { label: "National Farmers Helpline", number: "1551", available: "24/7" },
      { label: "Agri-Business Center", number: "1800-425-1556", available: "24/7" },
    ]
  },
  {
    category: "Government Schemes",
    icon: "🏛️",
    color: "blue",
    contacts: [
      { label: "PM-Kisan Helpline", number: "155261", available: "24/7" },
      { label: "PM-Kisan Toll Free", number: "1800115526", available: "24/7" },
      { label: "NHB Helpline", number: "1800-180-2006", available: "Mon-Sat" },
    ]
  },
  {
    category: "Weather & Crop",
    icon: "🌤️",
    color: "cyan",
    contacts: [
      { label: "Weather Updates", number: "1800-180-1717", available: "24/7" },
      { label: "Crop Insurance", number: "1800-258-0800", available: "24/7" },
    ]
  },
];

export default function HelplinePage() {
  const [isCallOpen, setIsCallOpen] = useState(false);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-green-50/30 to-slate-100 dark:from-slate-950 dark:via-green-950/10 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 text-white p-6 sm:p-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">AgriHelp Center</h1>
              <p className="text-green-100 text-sm sm:text-base max-w-lg">
                Get instant agricultural assistance from AI experts or connect with government helplines.
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCallOpen(true)}
              className="group flex items-center gap-3 bg-white text-green-700 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <PhoneCall className="w-5 h-5" />
              <span>Call AI Expert</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>

        {/* Emergency Numbers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-red-500" />
            <h2 className="text-lg font-semibold">Emergency Services</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {emergencyServices.map((service, i) => (
              <motion.a
                key={i}
                href={`tel:${service.number.split(' ')[0]}`}
                whileHover={{ scale: 1.02, y: -2 }}
                className="group relative flex flex-col items-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${service.color} rounded-l-xl`} />
                <span className="text-2xl mb-1">{service.icon}</span>
                <span className="font-bold text-sm group-hover:text-red-600 transition-colors">{service.name}</span>
                <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{service.number}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Helplines Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-green-600" />
            <h2 className="text-lg font-semibold">Government Helplines</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {helplines.map((section, idx) => (
              <motion.div
                key={idx}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
              >
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center gap-2">
                  <span className="text-xl">{section.icon}</span>
                  <span className="font-semibold">{section.category}</span>
                </div>
                <div className="p-3 space-y-2">
                  {section.contacts.map((contact, cIdx) => (
                    <a
                      key={cIdx}
                      href={`tel:${contact.number}`}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800 border border-transparent hover:border transition-all group"
                    >
                      <div>
                        <div className="font-medium text-sm text-slate-800 dark:text-slate-200">{contact.label}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {contact.available}
                        </div>
                      </div>
                      <span className="font-bold text-green-600 dark:text-green-400 text-sm">{contact.number}</span>
                    </a>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call Modal */}
        <AgentCallModal isOpen={isCallOpen} onClose={() => setIsCallOpen(false)} />
      </div>
    </div>
  );
}