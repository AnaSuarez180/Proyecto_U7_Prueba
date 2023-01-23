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
app.get('/', (req: Request, res: Response) => {
    res.send('Hola, Welcome')
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


app.get('/api/v1/getusers', async (req: Request, res: Response) => {
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

app.get("/api/v1/getsongs", async (req, res) => {
    try {
        const songs = await prisma.song.findMany();
        const songsWithPlaylist = await Promise.all(songs.map(async (song) => {
            const playlists = await prisma.playlist.findMany({
                where: {
                    songs: {
                        some: {
                            id:song.id
                        }
                    }
                },
                select: {
                    name: true
                }
            });
            return {
                ...song,
                playlists
            }
        }))
        res.json({songsWithPlaylist});
    } catch (error) {
    res.status(500).json({
        success: false,
        message: 'Error al obtener las canciones',
        
    });
  }
  });

app.get("/api/v1/getsongs/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const songs = await prisma.song.findMany({ where: { id: Number(id) } });
      const song = songs[0];
        if (!song) {
            return res.status(404).json({ error: 'song not found' });
        }
        const playlists = await prisma.playlist.findMany({
            where: {
                songs: {
                    some: {
                        id: Number(id)
                    }
                }
            }
        });
        res.json({song, playlists});
    } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Error al obtener la cancion',
          
      });
    }
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

app.get("/api/v1/getplaylists", async (req, res) => {
    try {
      const playlists = await prisma.playlist.findMany({
        include: { songs: true }
      });
      res.json(playlists);
    } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Error al obtener las playlists',
          
      });
    }
  });

app.post("/api/v1/playlists/addsong", async (req, res) => {
const { id_song, id_playlist } = req.body;
try {
    const songs = await prisma.song.findMany({ where: { id: id_song } });
    const song = songs[0];
    const playlists = await prisma.playlist.findMany({ where: { id: id_playlist } });
    const playlist = playlists[0];
    if (!song) {
        return res.status(404).json({ error: 'song not found' });
    }
    if (!playlist) {
        return res.status(404).json({ error: 'playlist not found' });
    }
    await prisma.playlist.update({
        where: { id: id_playlist },
        data: {
            songs: {
                connect: { id: id_song }
            }
        }
    });
    res.json({ message: "song added successfully to the playlist" });
} catch (error) {
    res.status(500).json({
        success: false,
        message: 'Error al añadir la cancion',
        
    });
}
});
  

app.listen(port, () => {
    console.log(`El servidor se ejecuta en http://localhost:${port}`);
  });