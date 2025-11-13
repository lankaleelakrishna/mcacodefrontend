import React from 'react';

interface ProductRowProps {
    product: {
        id: string;
        name: string;
        price: number;
        // Add other product fields as necessary
    };
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, onEdit, onDelete }) => {
    return (
        <tr>
            <td>{product.name}</td>
            <td>{product.price}</td>
            <td>
                <button onClick={() => onEdit(product.id)}>Edit</button>
                <button onClick={() => onDelete(product.id)}>Delete</button>
            </td>
        </tr>
    );
};

export default ProductRow;