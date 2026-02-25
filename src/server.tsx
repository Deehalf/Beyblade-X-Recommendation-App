import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
    const app = express();
    app.use(express.json());

    app.post('/api/log-search', (req: Request, res: Response) => {
        const { query } = req.body;
        if (query) {
            const logEntry = `${new Date().toISOString()} - ${query}\n`;
            fs.appendFile(path.join(__dirname, 'logs.txt'), logEntry, (err) => {
                if (err) {
                    console.error('Failed to write to log file:', err);
                    return res.status(500).send('Failed to log search query.');
                }
                res.status(200).send('Search query logged.');
            });
        } else {
            res.status(400).send('No query provided.');
        }
    });

    app.get('/api/logs', (req: Request, res: Response) => {
        if (req.query.secret !== 'beybladex') {
            return res.status(401).send('Unauthorized');
        }

        fs.readFile(path.join(__dirname, 'logs.txt'), 'utf8', (err, data) => {
            if (err) {
                console.error('Failed to read log file:', err);
                return res.status(500).send('Failed to retrieve logs.');
            }
            res.header('Content-Type', 'text/plain');
            res.send(data);
        });
    });

    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
    });

    app.use(vite.middlewares);

    app.listen(3000, '0.0.0.0', () => {
        console.log('Server is running at http://localhost:3000');
    });
}

createServer();
