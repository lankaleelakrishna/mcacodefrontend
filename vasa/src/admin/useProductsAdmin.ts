import { useEffect, useState } from 'react';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../lib/api-client';

const useProductsAdmin = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchProducts();
                setProducts(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    const handleCreateProduct = async (product) => {
        try {
            const newProduct = await createProduct(product);
            setProducts((prev) => [...prev, newProduct]);
        } catch (err) {
            setError(err);
        }
    };

    const handleUpdateProduct = async (id, updatedProduct) => {
        try {
            const updated = await updateProduct(id, updatedProduct);
            setProducts((prev) => prev.map((prod) => (prod.id === id ? updated : prod)));
        } catch (err) {
            setError(err);
        }
    };

    const handleDeleteProduct = async (id) => {
        try {
            await deleteProduct(id);
            setProducts((prev) => prev.filter((prod) => prod.id !== id));
        } catch (err) {
            setError(err);
        }
    };

    return {
        products,
        loading,
        error,
        handleCreateProduct,
        handleUpdateProduct,
        handleDeleteProduct,
    };
};

export default useProductsAdmin;