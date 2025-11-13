import React from 'react';
import ProductsAdmin from '../admin/ProductsAdmin';
import AdminLayout from '../components/admin/AdminLayout';

const Admin = () => {
    return (
        <AdminLayout>
            <h1>Admin Dashboard</h1>
            <ProductsAdmin />
        </AdminLayout>
    );
};

export default Admin;