const dbConfigs = [
    {
        name: "local",
        host: "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "123456789",
        database: process.env.DB_NAME || "localdb",
        port: process.env.DB_PORT || "3306"
    },
    // Add more database configurations as needed
];

module.exports = dbConfigs; 