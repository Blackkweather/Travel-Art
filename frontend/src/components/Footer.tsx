import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Mail, Phone, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react'

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 text-navy py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <img 
                src="/logo-transparent.png" 
                alt="Travel Art" 
                className="h-36 w-auto object-contain"
              />
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              Connecting luxury hotels with talented artists to create unforgettable rooftop performances, 
              intimate concerts, and magical experiences that inspire and delight guests worldwide.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-gold transition-colors">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gold transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gold transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-600 hover:text-gold transition-colors">
                <Linkedin className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-serif font-semibold mb-6 gold-underline">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/how-it-works" className="text-gray-600 hover:text-gold transition-colors">
                  How it Works
                </Link>
              </li>
              <li>
                <Link to="/partners" className="text-gray-600 hover:text-gold transition-colors">
                  Partners
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-600 hover:text-gold transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/top-artists" className="text-gray-600 hover:text-gold transition-colors">
                  Top Artists
                </Link>
              </li>
              <li>
                <Link to="/top-hotels" className="text-gray-600 hover:text-gold transition-colors">
                  Top Hotels
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-serif font-semibold mb-6 gold-underline">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-gray-600">Paris, France</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-gray-600">hello@travelart.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-gray-600">+33 1 23 45 67 89</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-300 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © 2024 Travel Art. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-gray-500 hover:text-gold transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-500 hover:text-gold transition-colors text-sm">
              Terms of Service
            </Link>
            <Link to="/cookies" className="text-gray-500 hover:text-gold transition-colors text-sm">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
