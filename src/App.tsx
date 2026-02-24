/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Papa from 'papaparse';


interface Combo {
  place: string;
  combo: string;
  date: string;
  month: string;
}

export default function App() {
  const [query, setQuery] = useState('');

  const [filteredCombos, setFilteredCombos] = useState<Combo[]>([]);
  const [topCombos, setTopCombos] = useState<{ title: string; combos: { combo: string; count: number; }[] }[]>([]);



  useEffect(() => {
    if (query.trim() === '') {
      setFilteredCombos([]);
      return;
    }

    const fetchFilteredCombos = async () => {
      const response = await fetch(`/api/combos?part=${query}`);
      const data = await response.json();
      setFilteredCombos(data);
    };

    fetchFilteredCombos();
  }, [query]);

  useEffect(() => {
    const fetchTopCombos = async () => {
      const response = await fetch(`/api/top-combos?part=${query}`);
      const data = await response.json();
      setTopCombos(data);
    };

    fetchTopCombos();
  }, [query]);

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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a Beyblade part (e.g., Dran Sword, Flat, 3-60)..."
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
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
