const DatabaseUtils = require('../utils/db.utils');
const FileUtils = require('../utils/file.utils');
const ZipUtils = require('../utils/zip.utils');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

class QueryController {
    async executeQueries(req, res) {
        let executionFolder = null;
        let zipPath = null;

        try {
            const { queries, shouldExport, dbConfig } = req.body;

            if (!queries || !Array.isArray(queries)) {
                return res.status(400).json({ error: 'Queries must be provided as an array' });
            }

            if (!dbConfig || !dbConfig.type || !Array.isArray(dbConfig.configs)) {
                return res.status(400).json({ error: 'Invalid database configuration' });
            }

            const dbUtils = new DatabaseUtils(dbConfig);
            const results = await dbUtils.executeQueriesOnAllDbs(queries, shouldExport);
            executionFolder = results.executionFolder;

            if (shouldExport && executionFolder) {
                const folderName = path.basename(executionFolder);
                zipPath = await ZipUtils.createZipFromFolder(executionFolder, folderName);
                results.zipPath = zipPath;

                // Clean up the execution folder after creating the ZIP
                if (fsSync.existsSync(executionFolder)) {
                    await fs.rm(executionFolder, { recursive: true, force: true });
                }
            }

            res.json(results);
        } catch (error) {
            console.error('Error executing queries:', error);

            // Clean up in case of error
            await this.cleanupFiles(zipPath, executionFolder);

            res.status(500).json({ error: error.message });
        }
    }

    async downloadResults(req, res) {
        const { zipPath } = req.query;

        if (!zipPath || !fsSync.existsSync(zipPath)) {
            return res.status(404).json({ error: 'ZIP file not found' });
        }

        res.download(zipPath, path.basename(zipPath), async (err) => {
            // Delete the ZIP file after it has been sent or if there was an error
            this.cleanupFiles(zipPath)
                .catch(cleanupError => console.error('Error deleting ZIP file:', cleanupError));

            if (err) {
                console.error('Error during file download:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error downloading file' });
                }
            }
        });
    }

    async executeQueryFromFile(req, res) {
        let executionFolder = null;
        let zipPath = null;
        let uploadedFilePath = null;

        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            uploadedFilePath = req.file.path;
            const { shouldExport, dbConfig } = req.body;

            if (!dbConfig || !dbConfig.type || !Array.isArray(dbConfig.configs)) {
                return res.status(400).json({ error: 'Invalid database configuration' });
            }

            const queries = await FileUtils.readSqlFile(uploadedFilePath);
            const dbUtils = new DatabaseUtils(dbConfig);
            const results = await dbUtils.executeQueriesOnAllDbs(queries, shouldExport === 'true');
            executionFolder = results.executionFolder;

            if (shouldExport && executionFolder) {
                const folderName = path.basename(executionFolder);
                zipPath = await ZipUtils.createZipFromFolder(executionFolder, folderName);
                results.zipPath = zipPath;

                // Clean up the execution folder after creating the ZIP
                if (fsSync.existsSync(executionFolder)) {
                    await fs.rm(executionFolder, { recursive: true, force: true });
                }
            }

            // Clean up the uploaded file as it's no longer needed
            if (uploadedFilePath && fsSync.existsSync(uploadedFilePath)) {
                await fs.unlink(uploadedFilePath);
            }

            res.json(results);
        } catch (error) {
            console.error('Error executing queries from file:', error);

            // Clean up in case of error
            await this.cleanupFiles(zipPath, executionFolder, uploadedFilePath);

            res.status(500).json({ error: error.message });
        }
    }

    async saveQueryFile(req, res) {
        try {
            const { content } = req.body;

            if (!content) {
                return res.status(400).json({ error: 'Query content must be provided' });
            }

            const queriesDir = path.join(__dirname, '..', 'queries');

            // Ensure the queries directory exists
            if (!fsSync.existsSync(queriesDir)) {
                await fs.mkdir(queriesDir, { recursive: true });
            }

            const timestamp = Date.now();
            const filePath = path.join(queriesDir, `queries_${timestamp}.sql`);

            const savedPath = await FileUtils.saveFile(filePath, content);
            res.json({ filePath: savedPath });
        } catch (error) {
            console.error('Error saving query file:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Helper method to clean up files
    async cleanupFiles(...filePaths) {
        for (const filePath of filePaths) {
            if (filePath && fsSync.existsSync(filePath)) {
                try {
                    if (fsSync.statSync(filePath).isDirectory()) {
                        await fs.rm(filePath, { recursive: true, force: true });
                    } else {
                        await fs.unlink(filePath);
                    }
                } catch (error) {
                    console.error(`Error cleaning up file ${filePath}:`, error);
                }
            }
        }
    }
}

module.exports = new QueryController();