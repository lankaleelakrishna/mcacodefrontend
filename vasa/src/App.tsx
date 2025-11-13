import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Admin from './pages/Admin';
import Products from './pages/Products';
import ProductsAdmin from './admin/ProductsAdmin';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Products />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/products" element={<ProductsAdmin />} />
      </Routes>
    </Router>
  );
};

export default App;