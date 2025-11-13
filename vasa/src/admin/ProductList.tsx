import React from 'react';
import { useProductsAdmin } from './useProductsAdmin';
import ProductRow from './ProductRow';

const ProductList = () => {
    const { products, deleteProduct, isLoading, error } = useProductsAdmin();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error loading products: {error.message}</div>;
    }

    return (
        <div>
            <h2>Product List</h2>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <ProductRow 
                            key={product.id} 
                            product={product} 
                            onDelete={deleteProduct} 
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductList;