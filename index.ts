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
    const { name, artist, album, year, genre, duration,playlists,privacysong } = req.body
    const song = await prisma.song.create({
        data: {
            name,
            artist,
            album,
            year,
            genre,
            duration,
            privacysong,
            playlists: {}
          
        }
    })
    res.json(song)
  })

app.get("/api/v1/getsongs", async (req, res) => {
    try {
        const songs = await prisma.song.findMany();

        const songsWithPlaylist = await Promise.all(songs.map(async (song:any) => {
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
        res.json({ songsWithPlaylist });
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

app.post("/api/v1/token", async (req: Request, res: Response) => {
    try {
        const data = req.body
    
        const element = await prisma.user.findUnique({
          where: {email:data.email}
        })
    
        if (element && element.password === data.password) {
          const token = jwt.sign({element}, process.env.SECRET_KEY??"", {
            expiresIn:"12h"
          })
          res.status(200).json({
            element,
            token,
          });
        }
        
      } catch (error) {
        res.status(500).json({
          ok: false,
          message: error,
        });
        console.log(error);
      }
}),

app.post('/login', async (req: Request, res: Response) => {
    try {
    const user = req.body as { email: string, password: string};
    const email = user.email;
    const password = user.password;

    const existingUser = await prisma.user.findUnique({
        where: {
            email: email
        }
    });

    if(!existingUser) {
        return res.status(404).json({error: 'Usuario no encontrado.'});
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if(!isMatch) {
        return res.status(401).json({error: 'Contraseña incorrecta'});
    }

    const token = jwt.sign({id: existingUser.id}, 'secretKey');

    res.status(200).json({
        ok: true,
        result: { token },
    });
    } catch (error) {
    res.status(500).json({
        ok: false,
        message: error,
    });
    console.log(error);
    }
});

app.get('/songs',async (req: Request, res: Response) => {
    const util = require('util');
    const verify = util.promisify(jwt.verify);

    async function validarToken(req: Request, res: Response) {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) {
    return false;
    }

    const token = authorization.replace("Bearer ", "");
    try {
    await verify(token, 'secretKey');
    return true;
    } catch (err) {
    return false;
    }
}
    const isTokenValid = await validarToken(req, res);
    let songs;
    if (!isTokenValid) {
        songs = await prisma.song.findMany({ where: { privacysong: false } });
    } else {
        songs = await prisma.song.findMany();
    }
    res.json(songs);
});

app.listen(port, () => {
    console.log(`El servidor se ejecuta en http://localhost:${port}`);
  });
