# SQL Query Hub - Backend

A powerful Node.js backend service for executing SQL queries across multiple database types with organized exports and logging capabilities.

## 🌐 Live API
The backend API is deployed and accessible at: [SQL Query Hub API](https://sql-query-hub-backend.onrender.com)

## ✨ Features

- **Multi-Database Support**: Execute queries on MySQL, PostgreSQL, and MSSQL databases
- **Organized Exports**: Automatically exports query results to CSV files
- **Query Batching**: Run multiple SQL queries in sequence
- **Structured Output**: Creates organized folders for each execution with:
  - Query results in XLSX format
  - Execution logs
  - Row count summaries
- **ZIP Compression**: Automatically compresses results for easy download
- **Error Handling**: Comprehensive error handling and logging
- **File Management**: Automatic cleanup of temporary files
- **Cross-Origin Support**: Configured CORS for secure frontend communication

## 🛠️ Tech Stack

- Node.js
- Express.js
- MySQL2
- PostgreSQL
- MSSQL
- Render (Hosting)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- Access to at least one of the following databases:
  - MySQL
  - PostgreSQL
  - MSSQL

### Local Installation

1. Clone the repository:
```bash
git clone https://github.com/Ali-Bhatti/sql-query-hub-backend.git
cd sql-query-hub-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
UPLOAD_DIR=uploads
NODE_ENV=development
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### POST /api/queries/execute-queries
Execute multiple SQL queries and export results.

**Request Body:**
```json
{
  "queries": ["SELECT * FROM users", "SELECT * FROM orders"],
  "shouldExport": true,
  "dbConfig": {
    "type": "mysql|postgres|mssql",
    "configs": [{
      "name": "Database 1",
      "host": "localhost",
      "port": "3306",
      "user": "username",
      "password": "password",
      "database": "dbname"
    }]
  }
}
```

**Response:**
```json
{
  "results": {
    "Database 1": [{
      "queryNumber": "query_1",
      "rows": [...],
      "count": 10,
      "exportPath": "path/to/export.xlsx"
    }]
  },
  "counts": {
    "query_1": {
      "Database 1": 10
    }
  },
  "zipPath": "path/to/results.zip"
}
```

## 📁 Project Structure

```
sql-query-hub-backend/
├── config/
│   └── db_configs.js     # Database configuration handlers
├── controllers/
│   └── query.controller.js # Query execution logic
├── middleware/
│   └── upload.js         # File upload middleware
├── routes/
│   ├── index.js         # Route aggregator
│   └── query.routes.js  # Query-related routes
├── utils/
│   ├── db.utils.js      # Database utilities
│   ├── file.utils.js    # File handling utilities
│   └── zip.utils.js     # ZIP compression utilities
├── server.js            # Application entry point
└── package.json         # Project dependencies
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| UPLOAD_DIR | Directory for temporary files | uploads |
| NODE_ENV | Environment mode | development |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request