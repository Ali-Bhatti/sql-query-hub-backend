const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

class ZipUtils {
    static async createZipFromFolder(folderPath, zipName) {
        return new Promise((resolve, reject) => {
            const zipPath = path.join(path.dirname(folderPath), `${zipName}.zip`);
            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', {
                zlib: { level: 9 } // Maximum compression
            });

            output.on('close', () => {
                resolve(zipPath);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive.directory(folderPath, false);
            archive.finalize();
        });
    }
}

module.exports = ZipUtils;