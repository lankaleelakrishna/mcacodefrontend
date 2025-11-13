import React, { useEffect, useState } from 'react';
import useProductsAdmin from './useProductsAdmin';

type Product = {
    name: string;
    price: string;
    description: string;
};

type Props = {
    product?: Product | null;
    onSubmit: (product: Product) => void;
};

const ProductForm: React.FC<Props> = ({ product, onSubmit }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (product) {
            setName(product.name);
            setPrice(product.price);
            setDescription(product.description);
            setIsEditing(true);
        } else {
            setName('');
            setPrice('');
            setDescription('');
            setIsEditing(false);
        }
    }, [product]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const productData = { name, price, description };
        onSubmit(productData);
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setPrice('');
        setDescription('');
        setIsEditing(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Name:</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Price:</label>
                <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Description:</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
            </div>
            <button type="submit">{isEditing ? 'Update Product' : 'Create Product'}</button>
        </form>
    );
};

export default ProductForm;