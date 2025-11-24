import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import React, { useState } from 'react';
import axios from 'axios';
import AuthCard from './AuthCard';

const CustomerSignup = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/customer/signup', form);
      setMessage(res.data.message || 'Signup successful!');
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <>
      <Navbar />
      <AuthCard
        title="Customer Signup"
        logoSrc="/logo.jpeg"
        subtitle="Create a customer account to shop at VASA."
      >
        <form onSubmit={handleSubmit} className="w-full">
          <label className="block text-green-900 font-semibold mb-1">Username</label>
          <input name="username" placeholder="Enter your username" onChange={handleChange} required className="w-full mb-4 p-2 border rounded" />
          <label className="block text-green-900 font-semibold mb-1">Email</label>
          <input name="email" placeholder="Enter your email" onChange={handleChange} required className="w-full mb-4 p-2 border rounded" />
          <label className="block text-green-900 font-semibold mb-1">Phone Number</label>
          <input name="phone_number" placeholder="Enter your phone number" onChange={handleChange} required className="w-full mb-4 p-2 border rounded" />
          <label className="block text-green-900 font-semibold mb-1">Password</label>
          <input name="password" type="password" placeholder="Enter your password" onChange={handleChange} required className="w-full mb-4 p-2 border rounded" />
          <label className="block text-green-900 font-semibold mb-1">Confirm Password</label>
          <input name="confirm_password" type="password" placeholder="Confirm your password" onChange={handleChange} required className="w-full mb-4 p-2 border rounded" />
          <button type="submit" className="w-full bg-yellow-600 text-white p-2 rounded font-semibold">Sign Up</button>
          <div className="mt-2 text-red-600">{message}</div>
          <div className="mt-6 text-center">
            <span className="text-gray-600">Already have an account? </span>
            <a href="/login" className="text-yellow-700 font-semibold underline">Log In</a>
          </div>
        </form>
      </AuthCard>
      <Footer />
    </>
  );
};

export default CustomerSignup;
