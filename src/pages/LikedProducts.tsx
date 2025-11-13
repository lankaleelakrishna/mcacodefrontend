import React from 'react';
import { useLiked } from '../contexts/LikedContext';
import ProductCard from '../components/ProductCard';
import { ApiClient } from '@/lib/api-client';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.tsx';
import { useState, useEffect } from 'react';

const LikedProducts = () => {
  const { likedProducts } = useLiked();
  const [loading, setLoading] = useState(true);
  const [likedProductsData, setLikedProductsData] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await ApiClient.getPerfumes();
        if (response?.perfumes) {
          const filteredProducts = response.perfumes.filter(product =>
            likedProducts.includes(String(product.id))
          );
          setLikedProductsData(filteredProducts);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [likedProducts]);

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Liked Products</h1>
        {likedProductsData.length === 0 ? (
          <div className="text-center text-gray-500">
            <p>You haven't liked any products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {likedProductsData.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default LikedProducts;