# Elastic Path Admin Portal

A modern admin portal built with NextJS, TypeScript, and TailwindCSS for managing Elastic Path organizations and stores.

## Features

- 🔐 Secure authentication with Elastic Path OAuth
- 🏢 Organization management with list view
- 🛍️ Store management with list view
- 📱 Responsive design with TailwindCSS
- ⚡ Fast performance with NextJS
- 🔒 Type-safe development with TypeScript

## Prerequisites

- Node.js 18+
- npm or yarn
- Elastic Path Commerce Cloud account

## Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd elasticpath-admin-portal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_EPCC_ENDPOINT_URL=api.moltin.com
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Authentication

1. Enter your Elastic Path email and password
2. Click "Sign in" to authenticate
3. Upon successful authentication, you'll be redirected to the dashboard

### Dashboard

- **Organizations Tab**: View all organizations associated with your account
- **Stores Tab**: View all stores associated with your account
- **Sign Out**: Click the sign out button to log out

## Project Structure

```
elasticpath-admin-portal/
├── app/                    # NextJS app directory
│   ├── globals.css        # Global styles with TailwindCSS
│   ├── layout.tsx         # Root layout with AuthProvider
│   └── page.tsx           # Main page component
├── components/            # React components
│   ├── Dashboard.tsx      # Dashboard with organizations/stores
│   └── LoginForm.tsx      # Login form component
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── types/                 # TypeScript type definitions
│   └── auth.ts           # Authentication and API types
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # TailwindCSS configuration
├── tsconfig.json          # TypeScript configuration
└── README.md             # Project documentation
```

## API Integration

The application integrates with Elastic Path Commerce Cloud APIs:

- **Authentication**: OAuth 2.0 password grant
- **User Data**: `/v2/me` endpoint
- **Organizations**: `/v2/organizations` endpoint
- **Stores**: `/v2/stores` endpoint

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. Create new components in the `components/` directory
2. Add TypeScript types in the `types/` directory
3. Update the authentication context if needed
4. Follow the existing code patterns and styling

## Technologies Used

- **NextJS 14** - React framework with app router
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **React Context** - State management
- **Elastic Path API** - Commerce cloud platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
