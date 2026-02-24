/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  import Papa from 'papaparse';
import { beybladeData } from './src/data/beyblades';

interface Combo {
  place: string;
  combo: string;
  date: string;
  month: string;
}

let combos: Combo[] = [];

Papa.parse(beybladeData, {
  complete: (result) => {
    const parsedCombos: Combo[] = [];
    const dataRows = result.data.slice(3);
    dataRows.forEach((row: any) => {
      if (!Array.isArray(row)) return;

      const month = row.find(cell => typeof cell === 'string' && ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].some(m => cell.startsWith(m))) || '';

      if (row[0] && row[1] && typeof row[0] === 'string' && row[0].trim() !== '') {
          parsedCombos.push({ place: '1st', combo: row[0].trim(), date: row[1].trim(), month });
      }
      if (row[3] && row[4] && typeof row[3] === 'string' && row[3].trim() !== '') {
          parsedCombos.push({ place: '2nd', combo: row[3].trim(), date: row[4].trim(), month });
      }
      if (row[6] && row[7] && typeof row[6] === 'string' && row[6].trim() !== '') {
          parsedCombos.push({ place: '3rd', combo: row[6].trim(), date: row[7].trim(), month });
      }
      if (row[9] && typeof row[9] === 'string' && row[9].trim() !== '') {
          const date = (row[10] && String(row[10]).includes('/')) ? String(row[10]).trim() : (row[7] || row[4] || row[1] || '').trim();
          parsedCombos.push({ place: '4th', combo: row[9].trim(), date: date, month });
      }
  });
    combos = parsedCombos;
  }
});

app.get('/api/top-combos', (req, res) => {
  const { part } = req.query;
  const lowerCaseQuery = typeof part === 'string' ? part.toLowerCase() : '';
  const combosToAnalyze = lowerCaseQuery ? combos.filter(item => 
    item.combo.toLowerCase().includes(lowerCaseQuery)
  ) : combos;

  // Most Repeated
  const comboCounts: { [key: string]: number } = {};
  combosToAnalyze.forEach(c => {
    comboCounts[c.combo] = (comboCounts[c.combo] || 0) + 1;
  });

  const sortedRepeated = Object.entries(comboCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([combo, count]) => ({ combo, count }));

  // Most Successful (1st place)
  const successfulCombos = combosToAnalyze.filter(c => c.place === '1st');
  const successfulCounts: { [key: string]: number } = {};
  successfulCombos.forEach(c => {
    successfulCounts[c.combo] = (successfulCounts[c.combo] || 0) + 1;
  });

  const sortedSuccessful = Object.entries(successfulCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([combo, count]) => ({ combo, count }));

  res.json([
      { title: 'Most Repeated', combos: sortedRepeated },
      { title: 'Most Successful (1st Place)', combos: sortedSuccessful },
  ]);
});

app.get('/api/combos', (req, res) => {
  const { part } = req.query;
  if (part && typeof part === 'string') {
    const lowerCaseQuery = part.toLowerCase();
    const results = combos.filter(item => 
      item.combo.toLowerCase().includes(lowerCaseQuery)
    );
    res.json(results);
  } else {
    res.json(combos);
  }
});

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
