/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, KeyboardEvent } from 'react';
import Papa from 'papaparse';
import { beybladeData } from './data/beyblades';

interface Combo {
  place: string;
  combo: string;
  date: string;
  month: string;
}

const parseDate = (dateStr: string): Date => {
    if (!dateStr || typeof dateStr !== 'string') return new Date(0);
    const parts = dateStr.split('/');
    if (parts.length !== 3) return new Date(0);

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return new Date(0);
    }

    const fullYear = year < 100 ? 2000 + year : year;

    const d = new Date(fullYear, month, day);
    if (isNaN(d.getTime())) {
        return new Date(0);
    }
    return d;
};

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [combos, setCombos] = useState<Combo[]>([]);
  const [filteredCombos, setFilteredCombos] = useState<Combo[]>([]);
  const [topCombos, setTopCombos] = useState<{ title: string; combos: { combo: string; count: number; }[] }[]>([]);

  useEffect(() => {
    const parseData = () => {
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
          setCombos(parsedCombos);
        }
      });
    };

    parseData();
  }, []);

  useEffect(() => {
    if (query.trim() === '') {
      setFilteredCombos([]);
      return;
    }

    const lowerCaseQuery = query.toLowerCase();
    const results = combos.filter(item => 
      item.combo.toLowerCase().includes(lowerCaseQuery)
    );

    results.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    setFilteredCombos(results);
  }, [query, combos]);

  useEffect(() => {
    if (combos.length === 0) return;

    const lowerCaseQuery = query.toLowerCase();
    const combosToAnalyze = query.trim() === '' ? combos : combos.filter(item => 
      item.combo.toLowerCase().includes(lowerCaseQuery)
    );

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

    setTopCombos([
        { title: 'Most Repeated', combos: sortedRepeated },
        { title: 'Most Successful (1st Place)', combos: sortedSuccessful },
    ]);

  }, [combos, query]);

  const handleSearch = () => {
    setQuery(inputValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <header className="text-center my-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Beyblade X Combo Finder</h1>
          <p className="text-gray-400 mt-2">Find the most competitive combos for any part.</p>
        </header>

        <div className="relative mb-8">
           <input
             type="text"
             value={inputValue}
             onChange={(e) => setInputValue(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder="Enter a Beyblade part (e.g., Dran Sword, Flat, 3-60)..."
             className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-12"
           />
           <button 
             onClick={handleSearch}
             className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-white"
             aria-label="Search"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
           </button>
         </div>

        <div className="my-8">
          <h2 className="text-2xl font-bold mb-4">Top Combos</h2>
          <div id="top-combos" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topCombos.map((category) => (
              <div key={category.title} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                <div className="space-y-2">
                  {category.combos.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <p className="font-semibold">{item.combo}</p>
                      <p className="text-gray-400">{item.count} times</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="results" className="space-y-4">
          {query.trim() !== '' && filteredCombos.length > 0 ? (
            filteredCombos.map((combo, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{combo.combo}</p>
                  <p className="text-sm text-gray-400">{combo.date} - {combo.month}</p>
                </div>
                <div className="text-right">
                   <p className={`font-bold text-lg ${combo.place === '1st' ? 'text-yellow-400' : combo.place === '2nd' ? 'text-gray-300' : combo.place === '3rd' ? 'text-yellow-600' : 'text-gray-500'}`}>
                    {combo.place}
                  </p>
                </div>
              </div>
            ))
          ) : (
            query.trim() !== '' && <p className='text-center text-gray-500'>No combos found for "{query}".</p>
          )}
        </div>
      </main>
    </div>
  );
}
