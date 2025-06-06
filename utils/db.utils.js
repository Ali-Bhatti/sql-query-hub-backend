const mysql = require('mysql2/promise');
const { Pool: PgPool } = require('pg');
const sql = require('mssql');
const XLSX = require('xlsx');
const moment = require('moment');
const fs = require('fs').promises;
const path = require('path');
const FileUtils = require('./file.utils');

class DatabaseUtils {
    constructor(dbConfig) {
        this.dbConfig = dbConfig;
        this.currentConnection = null;
        this.currentConfig = null;
        this.executionFolder = null;
    }

    async connect(config) {
        try {
            switch (this.dbConfig.type) {
                case 'mysql':
                    this.currentConnection = await mysql.createConnection({
                        host: config.host,
                        port: config.port,
                        user: config.user,
                        password: config.password,
                        database: config.database
                    });
                    break;

                case 'postgres':
                    this.currentConnection = new PgPool({
                        host: config.host,
                        port: config.port,
                        user: config.user,
                        password: config.password,
                        database: config.database
                    });
                    break;

                case 'mssql':
                    this.currentConnection = await sql.connect({
                        server: config.host,
                        port: parseInt(config.port),
                        user: config.user,
                        password: config.password,
                        database: config.database,
                        options: {
                            trustServerCertificate: true
                        }
                    });
                    break;

                default:
                    throw new Error(`Unsupported database type: ${this.dbConfig.type}`);
            }

            this.currentConfig = config;
            console.log(`Connected to database: ${config.name}`);
            return this.currentConnection;
        } catch (error) {
            console.error(`Error connecting to database ${config.name}:`, error);
            throw error;
        }
    }

    async disconnect() {
        if (this.currentConnection) {
            try {
                switch (this.dbConfig.type) {
                    case 'mysql':
                        await this.currentConnection.end();
                        break;
                    case 'postgres':
                        await this.currentConnection.end();
                        break;
                    case 'mssql':
                        await this.currentConnection.close();
                        break;
                }
                console.log(`Disconnected from database: ${this.currentConfig?.name}`);
            } catch (error) {
                console.error('Error disconnecting:', error);
            } finally {
                this.currentConnection = null;
                this.currentConfig = null;
            }
        }
    }

    async executeQuery(query) {
        try {
            switch (this.dbConfig.type) {
                case 'mysql':
                    const [rows] = await this.currentConnection.execute(query);
                    return rows;

                case 'postgres':
                    const result = await this.currentConnection.query(query);
                    return result.rows;

                case 'mssql':
                    const sqlResult = await this.currentConnection.request().query(query);
                    return sqlResult.recordset;

                default:
                    throw new Error(`Unsupported database type: ${this.dbConfig.type}`);
            }
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        }
    }

    async createExecutionFolder() {
        const formattedTimestamp = `execution on ${moment().format('YYYY-MM-DD')} (${moment().format('hh_mm_ss A')})`;
        this.executionFolder = path.join(__dirname, '..', 'queries-execution', formattedTimestamp);
        await fs.mkdir(this.executionFolder, { recursive: true });
        return this.executionFolder;
    }

    async writeExecutionLogs(logs) {
        if (!this.executionFolder) {
            await this.createExecutionFolder();
        }
        const logPath = path.join(this.executionFolder, 'logs.txt');
        await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
    }

    async exportToExcel(data, queryIndex, dbName) {
        try {
            if (!this.executionFolder) {
                await this.createExecutionFolder();
            }

            const exportDir = path.join(this.executionFolder, 'exports');
            await fs.mkdir(exportDir, { recursive: true });

            const fileName = `${dbName}_query_${queryIndex + 1}.xlsx`;
            const filePath = path.join(exportDir, fileName);

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');
            XLSX.writeFile(workbook, filePath);

            return filePath;
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            throw error;
        }
    }

    async executeQueriesOnAllDbs(queries, shouldExport = false) {
        const results = {};
        const counts = {};
        const logs = [];
        const queryMap = {};

        // Create execution folder for this run
        await this.createExecutionFolder();

        // Create query mapping
        queries.forEach((query, index) => {
            queryMap[`query_${index + 1}`] = query;
        });

        // Process one database at a time
        for (const config of this.dbConfig.configs) {
            try {
                // Connect to current database
                await this.connect(config);
                logs.push(`Connected to database: ${config.name}`);

                const dbResults = [];
                // Execute all queries on current database
                for (let queryIndex = 0; queryIndex < queries.length; queryIndex++) {
                    const query = queries[queryIndex];
                    try {
                        const rows = await this.executeQuery(query);

                        // Update counts using query index
                        const queryKey = `query_${queryIndex + 1}`;
                        if (!counts[queryKey]) counts[queryKey] = {};
                        counts[queryKey][config.name] = rows.length;

                        if (shouldExport && rows.length > 0) {
                            const exportPath = await this.exportToExcel(rows, queryIndex, config.name);
                            logs.push(`Exported results for "query_${queryIndex + 1}" from ${config.name} to ${exportPath}`);
                            dbResults.push({
                                queryNumber: queryKey,
                                query,
                                rows,
                                count: rows.length,
                                exportPath
                            });
                        } else {
                            dbResults.push({
                                queryNumber: queryKey,
                                query,
                                rows,
                                count: rows.length
                            });
                        }
                        logs.push(`Successfully executed query_${queryIndex + 1} on ${config.name}`);
                    } catch (queryError) {
                        logs.push(`Error executing query_${queryIndex + 1} on ${config.name}: ${queryError.message}`);
                        dbResults.push({
                            queryNumber: `query_${queryIndex + 1}`,
                            query,
                            error: queryError.message,
                            count: 0
                        });
                    }
                }

                results[config.name] = dbResults;

                // Disconnect from current database
                await this.disconnect();
                logs.push(`Disconnected from database: ${config.name}`);

            } catch (dbError) {
                logs.push(`Error processing database ${config.name}: ${dbError.message}`);
                results[config.name] = {
                    error: dbError.message,
                    count: 0
                };
                // Ensure connection is closed even if there was an error
                await this.disconnect();
            }
        }

        // Write execution logs and counts
        await this.writeExecutionLogs(logs);
        await FileUtils.writeCountFile(counts, this.executionFolder);

        return {
            results,
            counts,
            queryMapping: queryMap,
            executionFolder: this.executionFolder
        };
    }
}

module.exports = DatabaseUtils; 