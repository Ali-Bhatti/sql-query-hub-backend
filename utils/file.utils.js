const fs = require('fs').promises;
const path = require('path');

class FileUtils {
    /**
     * Read content from a file
     * @param {string} filePath - Path to the file
     * @param {Object} options - Reading options
     * @returns {Promise<any>} - File content
     */
    static async readFile(filePath, options = {}) {
        try {
            // Basic file reading implementation
            // Will be updated based on your specific requirements
            const content = await fs.readFile(filePath, 'utf-8');
            return content;
        } catch (error) {
            console.error('Error reading file:', error);
            throw error;
        }
    }

    /**
     * Save content to a file
     * @param {string} filePath - Path to save the file
     * @param {any} content - Content to save
     * @param {Object} options - Saving options
     * @returns {Promise<string>} - Path of saved file
     */
    static async saveFile(filePath, content, options = {}) {
        try {
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(filePath, content);
            return filePath;
        } catch (error) {
            console.error('Error saving file:', error);
            throw error;
        }
    }

    /**
     * Read and parse SQL file content, handling complex statements and comments
     * @param {string} filePath - Path to the SQL file
     * @returns {Promise<string[]>} Array of parsed SQL queries
     */
    static async readSqlFile(filePath) {
        try {
            // Read the SQL file
            let sqlFileData = await fs.readFile(filePath, 'utf8');

            // Remove comments, normalize whitespace, and handle delimiters
            sqlFileData = sqlFileData
                .split('\n')
                .map(line => line.replace(/--.*$/, ''))
                .filter(line => line.trim() !== '')
                .join(' ')
                .replace(/\t/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/^\s+|\s+$/g, '')
                .replace(/DELIMITER \$\$/g, '')
                .replace(/DELIMITER /g, '')
                .replace(/\/\//g, '')
                .replace(/\&\&/g, '');

            if (!sqlFileData) return [];

            // Split the file content into separate queries
            const queries = sqlFileData.split(';').map(q => q.trim()).filter(query => query);

            let resultQueries = [];
            let complexStatements = [];
            let inComplexStatement = false;

            for (let query of queries) {
                if (/CREATE\s+(DEFINER\s*=\s*`[^`]+`\s*@\s*`[^`]+`\s*)?\s*(TRIGGER|PROCEDURE)/i.test(query)) {
                    inComplexStatement = true;
                }

                if (inComplexStatement) {
                    complexStatements.push(query);
                    if (/END\s*\$\$/i.test(query)) {
                        complexStatements.pop();
                        complexStatements.push('END');
                        resultQueries.push(`${complexStatements.join('; ')};`);
                        complexStatements = [];
                        inComplexStatement = false;
                    } else if (/END\b/i.test(query) && query.trim() === "END") {
                        resultQueries.push(`${complexStatements.join('; ')};`);
                        complexStatements = [];
                        inComplexStatement = false;
                    }
                } else {
                    if (query) {
                        resultQueries.push(query + ';');
                    }
                }
            }

            return resultQueries;
        } catch (error) {
            console.error("Error reading SQL file:", error);
            throw new Error("Error occurred while reading the SQL file");
        }
    }

    /**
     * Original writeCountOfDataInFile function with added improvements
     * @param {Object} data - Count data to write
     * @param {string} folderName - Folder to write the count file to
     * @returns {Promise<string>} - Path of the count file
     */
    static async writeCountOfDataInFile(data, folderName) {
        let fileName = 'COUNT.txt';

        try {
            // Ensure data is provided
            if (!data) {
                throw new Error('No data provided to write');
            }

            // Create folder if provided
            if (folderName) {
                await fs.mkdir(folderName, { recursive: true });
                fileName = path.join(folderName, fileName);
            }

            // Convert data to string if it's not already
            const contentToWrite = typeof data === 'string' ? data : JSON.stringify(data, null, 4);

            await fs.writeFile(fileName, contentToWrite);
            console.log(`Data written to file '${fileName}'`);
            return fileName;

        } catch (error) {
            console.error('Error while writing count data to file:', error);
            throw error;
        }
    }

    /**
     * Improved version of writeCountFile with query mapping
     * @param {Object} counts - Count data with query numbers as keys
     * @param {string} folderName - Folder to write the count file to
     * @param {Object} [queryMapping] - Optional mapping of query numbers to actual queries
     * @returns {Promise<string>} - Path of the count file
     */
    static async writeCountFile(counts, folderName, queryMapping = null) {
        try {
            // Validate inputs
            if (!counts || typeof counts !== 'object') {
                throw new Error('Invalid counts data provided');
            }

            if (!folderName) {
                throw new Error('Folder name is required');
            }

            // Ensure the counts object uses the query_N format
            const formattedCounts = {};
            Object.entries(counts).forEach(([key, value]) => {
                // If the key doesn't match query_N format, format it
                if (!key.startsWith('query_')) {
                    const queryNum = key.replace(/\D/g, '');
                    formattedCounts[`query_${queryNum || Object.keys(formattedCounts).length + 1}`] = value;
                } else {
                    formattedCounts[key] = value;
                }
            });

            // Prepare the data structure
            const dataToWrite = {
                counts: formattedCounts
            };

            // Add query mapping if provided
            if (queryMapping) {
                dataToWrite.queryMapping = queryMapping;
            }

            // Write to file
            const filePath = path.join(folderName, 'COUNT.txt');
            await fs.writeFile(filePath, JSON.stringify(dataToWrite, null, 4));
            console.log(`Count data written to ${filePath}`);
            return filePath;

        } catch (error) {
            console.error('Error writing count file:', error);
            throw error;
        }
    }

    /**
     * Check if file exists
     * @param {string} filePath - Path to the file
     * @returns {Promise<boolean>} - True if file exists
     */
    static async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Copy a file from source to destination
     * @param {string} sourcePath - Source file path
     * @param {string} destinationPath - Destination file path
     * @returns {Promise<void>}
     */
    static async copyFile(sourcePath, destinationPath) {
        try {
            // Read source file
            const fileData = await fs.readFile(sourcePath, 'utf8');

            // Ensure destination directory exists
            const destDir = path.dirname(destinationPath);
            await fs.mkdir(destDir, { recursive: true });

            // Write to destination
            await fs.writeFile(destinationPath, fileData, 'utf8');
            console.log('File copied successfully');
        } catch (error) {
            console.error('Error copying file:', error);
            throw error;
        }
    }
}

module.exports = FileUtils;


