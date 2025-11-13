import React from 'react';
import ProductForm from './ProductForm';
import ProductList from './ProductList';
import useProductsAdmin from './useProductsAdmin';
import AdminLayout from '../components/admin/AdminLayout';

const ProductsAdmin = () => {
    const { products, createProduct, updateProduct, deleteProduct } = useProductsAdmin();

    return (
        <AdminLayout>
            <h1>Manage Products</h1>
            <ProductForm onSubmit={createProduct} />
            <ProductList 
                products={products} 
                onUpdate={updateProduct} 
                onDelete={deleteProduct} 
            />
        </AdminLayout>
    );
};

export default ProductsAdmin;