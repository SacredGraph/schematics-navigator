# Schematics Navigator

A modern web application for visualizing and navigating through schematics using Next.js, React, and Neo4j. This tool provides an interactive interface for exploring complex schematic relationships with features like zooming, panning, and Mermaid diagram integration.

## About

Schematics Navigator is a powerful tool designed to help users visualize and navigate through complex schematic relationships. It leverages Neo4j's graph database capabilities to store and retrieve schematic data, while providing an intuitive interface for exploring these relationships through interactive diagrams.

## Features

- Interactive schematic visualization with zoom and pan capabilities
- Mermaid diagram integration for complex relationship visualization
- Neo4j database integration for efficient data storage and retrieval
- Modern React components with TypeScript for type safety
- Responsive design with Tailwind CSS
- Real-time diagram updates
- Intuitive navigation interface

## Prerequisites

- Node.js (Latest LTS version recommended)
- Neo4j Database instance
- npm package manager

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
NEO4J_URI=your_neo4j_uri
NEO4J_USERNAME=your_username
NEO4J_PASSWORD=your_password
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/SacredGraph/schematics-navigator.git
cd schematics-navigator
```

2. Install dependencies:

```bash
npm install
```

## Development

To run the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Building for Production

To create a production build:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework for server-rendered applications
- [React](https://reactjs.org/) - UI library for building user interfaces
- [TypeScript](https://www.typescriptlang.org/) - Type safety and enhanced developer experience
- [Neo4j](https://neo4j.com/) - Graph database for storing schematic relationships
- [Mermaid](https://mermaid.js.org/) - Diagramming and visualization library
- [Panzoom](https://github.com/arijs/panzoom) - Smooth pan and zoom functionality
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## Project Structure

- `/app` - Next.js app directory containing pages and components
- `/lib` - Utility functions and shared code
- `/public` - Static assets
- `/node_modules` - Project dependencies

## Contributing

We welcome contributions to Schematics Navigator! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Links

- [GitHub Repository](https://github.com/SacredGraph/schematics-navigator)
- [Issue Tracker](https://github.com/SacredGraph/schematics-navigator/issues)
