import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

// Importando Prisma Client
import { PrismaClient } from '@prisma/client';


dotenv.config();


// Iniciando el cliente
const prisma = new PrismaClient();

const app: Express = express();
const port = process.env.PORT;

app.use(express.json());

//Home de prueba
app.get('/home', (req: Request, res: Response) => {
    res.send('Hola, Welcome')
});


app.listen(port, () => {
    console.log(`El servidor se ejecuta en http://localhost:${port}`);
  });