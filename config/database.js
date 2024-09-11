import dotenv from 'dotenv';
dotenv.config();

import { mysql2 } from 'mysql2/promise';

const connection = await mysql2.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

export default connection;
export { mysql2 };