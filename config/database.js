import dotenv from 'dotenv';
dotenv.config();

import mysql2 from 'mysql2/promise';

const connection = mysql2.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

const connectDB = async () => {
    try {
        const conn = await connection;
        console.log('Conexión establecida a la base de datos')
        return conn;
    } catch (error) {
        console.log('Error al connectarte a la base de datos')
        throw error;
    }
}

export default connectDB;
