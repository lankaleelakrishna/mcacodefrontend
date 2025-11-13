import React from 'react';
import ProductsAdmin from '../admin/ProductsAdmin';
import AdminLayout from '../components/admin/AdminLayout';

const Products = () => {
    return (
        <AdminLayout>
            <h1>Product Management</h1>
            <ProductsAdmin />
        </AdminLayout>
    );
};

export default Products;