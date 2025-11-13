# Vasa Project

## Overview
Vasa is a React-based application designed for managing products with an admin interface. This project includes functionalities for creating, updating, and deleting products, as well as a public-facing products page.

## Project Structure
```
vasa
├── src
│   ├── admin
│   │   ├── ProductsAdmin.tsx       # Main component for product management
│   │   ├── ProductForm.tsx          # Form for creating and updating products
│   │   ├── ProductList.tsx          # Displays a list of products
│   │   ├── ProductRow.tsx           # Represents a single product row
│   │   └── useProductsAdmin.ts      # Custom hook for product management logic
│   ├── components
│   │   ├── admin
│   │   │   ├── ConfirmDialog.tsx    # Confirmation dialog for actions
│   │   │   └── AdminLayout.tsx      # Layout component for admin pages
│   ├── pages
│   │   ├── Admin.tsx                # Main admin page
│   │   └── Products.tsx             # Public-facing products page
│   ├── lib
│   │   └── api-client.ts            # API functions for product management
│   ├── App.tsx                      # Main application component
│   └── main.tsx                     # Entry point of the application
├── package.json                     # npm configuration file
├── tsconfig.json                   # TypeScript configuration file
└── README.md                       # Project documentation
```

## Features
- **Admin Functionality**: Admin users can create, update, and delete products through a dedicated interface.
- **Product Management**: The application includes components for managing product data, including forms and lists.
- **API Integration**: Utilizes an API client for handling product-related requests.

## Getting Started
1. Clone the repository.
2. Navigate to the project directory.
3. Install dependencies using `npm install`.
4. Start the development server with `npm start`.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.