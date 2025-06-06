# SQL Query Hub - Backend

A powerful Node.js backend service for executing SQL queries across multiple database types with organized exports and logging capabilities.

## Features

- **Multi-Database Support**: Execute queries on MySQL, PostgreSQL, and MSSQL databases
- **Organized Exports**: Automatically exports query results to CSV files
- **Query Batching**: Run multiple SQL queries in sequence
- **Structured Output**: Creates organized folders for each execution with:
  - Query results in CSV format
  - Execution logs
  - Row count summaries
- **ZIP Compression**: Automatically compresses results for easy download
- **Error Handling**: Comprehensive error handling and logging

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Access to at least one of the following databases:
  - MySQL
  - PostgreSQL
  - MSSQL

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
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
```

## Project Structure

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

## API Endpoints

### POST /api/queries/execute-queries
Execute multiple SQL queries and export results.

**Request Body:**
```json
{
  "queries": ["SELECT * FROM table1", "SELECT * FROM table2"],
  "shouldExport": true,
  "dbConfig": {
    "type": "mysql|postgres|mssql",
    "host": "localhost",
    "port": 3306,
    "database": "db_name",
    "user": "username",
    "password": "password"
  }
}
```

### GET /api/queries/download-results
Download zipped query results.

**Query Parameters:**
- `zipPath`: Path to the ZIP file containing results

## Development

Start the development server with hot reload:
```bash
npm run dev
```

Start the production server:
```bash
npm start
```

## Error Handling

The application includes comprehensive error handling for:
- Database connection issues
- Query execution errors
- File system operations
- Invalid request formats

All errors are logged and returned with appropriate HTTP status codes and descriptive messages.

## Output Structure

For each query execution, the following structure is created:
```
queries-execution/
└── execution_YYYY-MM-DD_HH-MM-SS/
    ├── exports/
    │   ├── query_1.csv
    │   └── query_2.csv
    ├── COUNT.txt
    └── logs.txt
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
