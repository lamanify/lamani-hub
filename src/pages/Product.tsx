import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Star, Users, Shield, Calendar, MessageSquare } from 'lucide-react';

const ProductPage = () => {
  const features = [
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Patient Management",
      description: "Complete patient records, medical history, and PDPA-compliant data storage for Malaysian healthcare providers."
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-blue-600" />,
      title: "WhatsApp Integration", 
      description: "Instant patient communication with click-to-chat functionality and automated appointment reminders."
    },
    {
      icon: <Calendar className="h-8 w-8 text-blue-600" />,
      title: "Smart Scheduling",
      description: "Advanced appointment booking system with automated reminders and calendar synchronization."
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: "PDPA Compliant",
      description: "Secure, compliant patient data handling specifically designed for Malaysian healthcare regulations."
    }
  ];

  const testimonials = [
    {
      quote: "LamaniHub transformed our patient management. We save 3 hours daily on administrative tasks.",
      author: "Dr. Sarah Ahmad",
      clinic: "Ahmad Family Clinic, Kuala Lumpur",
      rating: 5
    },
    {
      quote: "The WhatsApp integration is game-changing. Our patients love the instant communication.",
      author: "Dr. Raj Patel", 
      clinic: "Dental Care Centre, Penang",
      rating: 5
    },
    {
      quote: "PDPA compliance made easy. Professional system that builds patient trust.",
      author: "Dr. Lim Wei Ming",
      clinic: "Specialist Clinic, Johor Bahru",
      rating: 5
    }
  ];

  const handleStartTrial = () => {
    // This would redirect to your checkout/signup flow
    window.location.href = '/auth?trial=true';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="LamaniHub" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-bold text-gray-900">LamaniHub</span>
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Features
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Pricing
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Reviews
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              <Link to="/auth" className="text-gray-700 hover:text-blue-600 text-sm font-medium">
                Sign In
              </Link>
              <button
                onClick={handleStartTrial}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                The Complete CRM Built for{' '}
                <span className="text-blue-200">Malaysian Clinics</span>
              </h1>
              <p className="text-xl mb-8 opacity-90">
                Manage patients, appointments, and communications in one PDPA-compliant platform. 
                Trusted by healthcare providers across Malaysia.
              </p>
              
              <div className="bg-white text-blue-900 p-6 rounded-lg mb-8 max-w-md">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">🎁</span>
                  <h3 className="text-xl font-bold">Start Your Free 14-Day Trial</h3>
                </div>
                <p className="text-sm mb-4">Full access to all features - no credit card required</p>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-green-600">FREE</span>
                  <span className="text-lg text-gray-600 ml-2">for 14 days, then RM49/month</span>
                </div>
              </div>
              
              <button
                onClick={handleStartTrial}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-xl font-semibold"
              >
                Start Free Trial Now →
              </button>
            </div>
            
            <div className="lg:flex justify-center hidden">
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg">
                <img 
                  src="/api/placeholder/500/400" 
                  alt="LamaniHub Dashboard Preview" 
                  className="rounded-lg shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything Your Clinic Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete patient management system designed specifically for Malaysian healthcare providers
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Complete Feature Set
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                'Unlimited patient records',
                'WhatsApp click-to-chat',
                'Appointment scheduling',
                'Automated reminders',
                'PDPA compliance',
                'Multi-user access',
                'Custom fields & forms',
                'Professional reports',
                'Data export/backup',
                'Priority support',
                'Mobile responsive',
                'Secure cloud hosting'
              ].map((feature, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Malaysian Healthcare Providers
            </h2>
            <p className="text-xl text-gray-600">
              See what clinic owners are saying about LamaniHub
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-4">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.clinic}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-3xl font-bold text-blue-600">500+</div>
                <div className="text-gray-600">Malaysian Clinics</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">50,000+</div>
                <div className="text-gray-600">Patients Managed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">99.9%</div>
                <div className="text-gray-600">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">24/7</div>
                <div className="text-gray-600">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Professional CRM for Malaysian clinics at an affordable price
            </p>
          </div>
          
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center relative">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full inline-block mb-6">
                🎁 14-Day FREE Trial
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                LamaniHub Professional
              </h3>
              
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">RM49</span>
                <span className="text-xl text-gray-600">/month per clinic</span>
              </div>
              
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Unlimited patient records</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>WhatsApp integration</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Appointment scheduling</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>PDPA compliance</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Multi-user access</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>Priority support</span>
                </li>
              </ul>
              
              <button
                onClick={handleStartTrial}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg text-lg font-semibold mb-4"
              >
                Start Free Trial
              </button>
              
              <p className="text-sm text-gray-600">
                No credit card required • Cancel anytime during trial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Clinic Management?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of Malaysian clinics already using LamaniHub to provide better patient care.
          </p>
          <button
            onClick={handleStartTrial}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-xl font-semibold"
          >
            Start Your Free 14-Day Trial
          </button>
          <p className="mt-4 text-sm opacity-75">
            No credit card required • Full access • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src="/logo.png" alt="LamaniHub" className="h-8 w-auto" />
                <span className="ml-2 text-xl font-bold">LamaniHub</span>
              </div>
              <p className="text-gray-400">
                The complete CRM solution built specifically for Malaysian healthcare providers.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><Link to="/auth" className="hover:text-white">Sign Up</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:support@lamanify.com" className="hover:text-white">Contact Support</a></li>
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">PDPA Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Lamanify</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Lamanify. All rights reserved. Built for Malaysian healthcare providers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductPage;
