import React from 'react';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="admin-layout">
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                {/* Add navigation links here if needed */}
            </header>
            <main className="admin-content">
                {children}
            </main>
            <footer className="admin-footer">
                <p>&copy; 2023 Your Company</p>
            </footer>
        </div>
    );
};

export default AdminLayout;