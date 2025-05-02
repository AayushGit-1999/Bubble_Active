import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import frame16 from '../Assets/Frame 16.png';

// Load Stripe outside of a component's render to avoid recreating the Stripe object on every render
const stripePromise = loadStripe('pk_test_51RI7bGQVqVgO2WQUb032W3EeQh7a9YwfamhmVY47z5V8LBmvLAWT7ftSgoEzaeI9HcDLMaUrBYLZBIluWCr1TiBb00tHa3fcsu'); // Replace with your real Stripe publishable key

const PaymentPage = () => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_1RI81EQVqVgO2WQU5UJC5Wqi', // Replace with your real Stripe price ID
        }),
      });

      const session = await response.json();

      if (!session.id) {
        console.error('Session ID not returned:', session);
        setLoading(false);
        return;
      }

      const stripe = await stripePromise;

      const { error } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (error) {
        console.error('Stripe redirect error:', error);
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <img src={frame16} alt="airbubble logo" className="h-6" />
          <span className="font-bold text-2xl">air bubble</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upgrade to Pro</h1>
          <p className="text-gray-400">Get access to premium features and unlimited mods</p>
        </div>

        <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-700">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold">Pro Plan</h2>
              <p className="text-gray-400">Monthly subscription</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">$19.99</p>
              <p className="text-gray-400">per month</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {[
              "Unlimited mod generations",
              "Priority support",
              "Advanced customization options",
              "Early access to new features"
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Upgrade Now'}
          </button>

          <p className="text-center text-sm text-gray-400 mt-6">
            You can cancel your subscription at any time
          </p>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;
