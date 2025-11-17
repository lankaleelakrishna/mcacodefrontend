import React from 'react'
import { Navigate } from 'react-router-dom';

const collections = [
  { id: 'best-sellers', title: 'Best Sellers', description: 'Our most loved fragrances' },
  { id: 'new-arrivals', title: 'New Arrivals', description: 'Fresh scents just launched' },
  { id: 'special-offers', title: 'Special Offers', description: 'Limited time offers' },
]

export default function Collections() {
  // Collections page removed; redirect to Contact page
  return <Navigate to="/contact" replace />;
}
