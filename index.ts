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

app.post('/api/v1/users', async (req: Request, res: Response) => {
const user = req.body as { name: string, email: string, password: string, date_born: string};
const password = user.password;
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

const newUser = await prisma.user.create({
    data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        last_session: new Date(),
        created_at: new Date(),
        date_born: new Date(user.date_born)
    }
});

res.json(newUser);
});


app.get('/api/v1/users', async (req: Request, res: Response) => {
const users = await prisma.user.findMany({
    select: {
        id: true,
        name: true,
        email: true,
        last_session: true,
        created_at: true,
        date_born: true
    }
});
res.json(users);
});
  
app.post('/api/v1/songs', async (req: Request, res: Response) => {
    const songs = await prisma.song.findMany();
    res.json(songs);
});

  
app.post("/api/v1/playlists", async (req, res) => {
try {
    const newPlaylist = await prisma.playlist.create({
    data: {
        name: req.body.name,
        user_id: req.body.user_id,
        songs: {
        connect: req.body.songs.map((song: any) => ({ id: song.id }))
        }
    }
    });
    res.json(newPlaylist);
} catch (error) {
    res.status(500).json({
        success: false,
        message: 'Error al obtener las playlist',
        
    });
}
});