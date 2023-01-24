"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
// Importando Prisma Client
const client_1 = require("@prisma/client");
dotenv_1.default.config();
// Iniciando el cliente
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const port = process.env.PORT;
app.use(express_1.default.json());
//Home de prueba
app.get('/', (req, res) => {
    res.send('Hola, Welcome');
});
app.post('/api/v1/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.body;
    const password = user.password;
    const salt = yield bcryptjs_1.default.genSalt(10);
    const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
    const newUser = yield prisma.user.create({
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
}));
app.get('/api/v1/getusers', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield prisma.user.findMany({
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
}));
app.post('/api/v1/songs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, artist, album, year, genre, duration, playlists, privacysong } = req.body;
    const song = yield prisma.song.create({
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
    });
    res.json(song);
}));
app.get("/api/v1/getsongs", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const songs = yield prisma.song.findMany();
        const songsWithPlaylist = yield Promise.all(songs.map((song) => __awaiter(void 0, void 0, void 0, function* () {
            const playlists = yield prisma.playlist.findMany({
                where: {
                    songs: {
                        some: {
                            id: song.id
                        }
                    }
                },
                select: {
                    name: true
                }
            });
            return Object.assign(Object.assign({}, song), { playlists });
        })));
        res.json({ songsWithPlaylist });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las canciones',
        });
    }
}));
app.get("/api/v1/getsongs/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const songs = yield prisma.song.findMany({ where: { id: Number(id) } });
        const song = songs[0];
        if (!song) {
            return res.status(404).json({ error: 'song not found' });
        }
        const playlists = yield prisma.playlist.findMany({
            where: {
                songs: {
                    some: {
                        id: Number(id)
                    }
                }
            }
        });
        res.json({ song, playlists });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener la cancion',
        });
    }
}));
app.post("/api/v1/playlists", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newPlaylist = yield prisma.playlist.create({
            data: {
                name: req.body.name,
                user_id: req.body.user_id,
                songs: {
                    connect: req.body.songs.map((song) => ({ id: song.id }))
                }
            }
        });
        res.json(newPlaylist);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las playlist',
        });
    }
}));
app.get("/api/v1/getplaylists", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playlists = yield prisma.playlist.findMany({
            include: { songs: true }
        });
        res.json(playlists);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las playlists',
        });
    }
}));
app.post("/api/v1/playlists/addsong", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_song, id_playlist } = req.body;
    try {
        const songs = yield prisma.song.findMany({ where: { id: id_song } });
        const song = songs[0];
        const playlists = yield prisma.playlist.findMany({ where: { id: id_playlist } });
        const playlist = playlists[0];
        if (!song) {
            return res.status(404).json({ error: 'song not found' });
        }
        if (!playlist) {
            return res.status(404).json({ error: 'playlist not found' });
        }
        yield prisma.playlist.update({
            where: { id: id_playlist },
            data: {
                songs: {
                    connect: { id: id_song }
                }
            }
        });
        res.json({ message: "song added successfully to the playlist" });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al añadir la cancion',
        });
    }
}));
app.post("/api/v1/token", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const data = req.body;
        const element = yield prisma.user.findUnique({
            where: { email: data.email }
        });
        if (element && element.password === data.password) {
            const token = jsonwebtoken_1.default.sign({ element }, (_a = process.env.SECRET_KEY) !== null && _a !== void 0 ? _a : "", {
                expiresIn: "12h"
            });
            res.status(200).json({
                element,
                token,
            });
        }
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            message: error,
        });
        console.log(error);
    }
})),
    app.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const user = req.body;
            const email = user.email;
            const password = user.password;
            const existingUser = yield prisma.user.findUnique({
                where: {
                    email: email
                }
            });
            if (!existingUser) {
                return res.status(404).json({ error: 'Usuario no encontrado.' });
            }
            const isMatch = yield bcryptjs_1.default.compare(password, existingUser.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Contraseña incorrecta' });
            }
            const token = jsonwebtoken_1.default.sign({ id: existingUser.id }, 'secretKey');
            res.status(200).json({
                ok: true,
                result: { token },
            });
        }
        catch (error) {
            res.status(500).json({
                ok: false,
                message: error,
            });
            console.log(error);
        }
    }));
app.get('/songs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const util = require('util');
    const verify = util.promisify(jsonwebtoken_1.default.verify);
    function validarToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { authorization } = req.headers;
            if (!authorization || !authorization.startsWith("Bearer ")) {
                return false;
            }
            const token = authorization.replace("Bearer ", "");
            try {
                yield verify(token, 'secretKey');
                return true;
            }
            catch (err) {
                return false;
            }
        });
    }
    const isTokenValid = yield validarToken(req, res);
    let songs;
    if (!isTokenValid) {
        songs = yield prisma.song.findMany({ where: { privacysong: false } });
    }
    else {
        songs = yield prisma.song.findMany();
    }
    res.json(songs);
}));
app.listen(port, () => {
    console.log(`El servidor se ejecuta en http://localhost:${port}`);
});
