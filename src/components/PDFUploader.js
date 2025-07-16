// components/PDFUploader.jsx
import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { MdSportsCricket, MdUploadFile, MdOutlineFileDownload } from 'react-icons/md';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;


export default function PDFUploader({ onExtract }) {
  const [loading, setLoading] = useState(false);
  const [battingFile, setBattingFile] = useState(null);
  const [bowlingFile, setBowlingFile] = useState(null);
  const [fieldingFile, setFieldingFile] = useState(null);

  const parsePDF = async (file) => {
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = async () => {
        const typedarray = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const text = content.items.map(item => item.str).join(' ');
          fullText += text + '\n';
        }
        resolve(fullText);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const extractBattingData = (text) => {
    // Combine all lines into one string (in case there are multiple)
    const allText = text.replace(/\n/g, ' ');
    // Split on a number at the start of a record (rank), but keep the number
    const playerRecords = allText.split(/\s(?=\d+\s+[A-Za-z])/g).filter(r => /^\d+\s+[A-Za-z]/.test(r));
    const result = [];

    playerRecords.forEach(record => {
      // Split by 2 or more spaces
      const parts = record.trim().split(/\s{2,}/);
      if (parts.length >= 16) {
        result.push({
          rank: parseInt(parts[0]),
          name: parts[1],
          team: parts[2],
          hand: parts[3],
          matches: parseInt(parts[4]),
          inns: parseInt(parts[5]),
          runs: parseInt(parts[6]),
          balls: parseInt(parts[7]),
          highest: parts[8],
          notOut: parseInt(parts[9]),
          average: parseFloat(parts[10]),
          strikeRate: parseFloat(parts[11]),
          fours: parseInt(parts[12]),
          sixes: parseInt(parts[13]),
          fifties: parseInt(parts[14]),
          hundreds: parseInt(parts[15])
        });
      }
    });

  
    return result.slice(1);
  };

  const extractBowlingData = (text) => {
    const allText = text.replace(/\n/g, ' ');
    const playerRecords = allText.split(/\s(?=\d+\s+[A-Za-z])/g).filter(r => /^\d+\s+[A-Za-z]/.test(r));
    const result = [];

    playerRecords.forEach((record, idx) => {
      const parts = record.trim().split(/\s{2,}/);

      // Fill missing fields with nulls to ensure 14 fields
      while (parts.length < 14) {
        parts.push(null);
      }
      // If there are more than 14 fields, join the extras into the last field
      if (parts.length > 14) {
        parts[13] = parts.slice(13).join(' ');
        parts.length = 14;
      }

      result.push({
        rank: parseInt(parts[0]),
        name: parts[1],
        team: parts[2],
        style: parts[3],
        matches: parseInt(parts[4]),
        inns: parseInt(parts[5]),
        overs: parts[6],
        runs: parseInt(parts[7]),
        wickets: parseInt(parts[8]),
        highest: parts[9],
        maidens: parseInt(parts[10]),
        average: parseFloat(parts[11]),
        economy: parseFloat(parts[12]),
        strikeRate: parseFloat(parts[13])
      });
    });

  
    return result.slice(2);
  };

  const extractFieldingData = (text) => {
    const allText = text.replace(/\n/g, ' ');
    // Split on a number at the start of a record (rank), but keep the number
    const playerRecords = allText.split(/\s(?=\d+\s+[A-Za-z])/g).filter(r => /^\d+\s+[A-Za-z]/.test(r));
    const result = [];

    playerRecords.forEach((record, idx) => {
      const parts = record.trim().split(/\s{2,}/);
      // There are 13 main fields + 2 for dropped/brilliant catches (15 total)
      while (parts.length < 15) {
        parts.push(null);
      }
      if (parts.length > 15) {
        parts[14] = parts.slice(14).join(' ');
        parts.length = 15;
      }
      result.push({
        rank: parseInt(parts[0]),
        name: parts[1],
        team: parts[2],
        matches: parseInt(parts[3]),
        dismissal: parseInt(parts[4]),
        catches: parseInt(parts[5]),
        caughtAndBowl: parseInt(parts[6]),
        caughtBehind: parseInt(parts[7]),
        runOuts: parseInt(parts[8]),
        assistRunOuts: parseInt(parts[9]),
        stumpings: parseInt(parts[10]),
        droppedCatches: parts[11],
        brilliantCatches: parts[12],
        extra1: parts[13], // in case of extra fields
        extra2: parts[14]
      });
    });

    return result.slice(2);
  };

  const handleParseAll = async () => {
    //if (!(battingFile && bowlingFile && fieldingFile)) return;
    setLoading(true);

    try {
      const [battingText, bowlingText, fieldingText] = await Promise.all([
        parsePDF(battingFile),
        parsePDF(bowlingFile),
        parsePDF(fieldingFile)
      ]);

      const batting = extractBattingData(battingText);
     const bowling = extractBowlingData(bowlingText);
      const fielding = extractFieldingData(fieldingText);


      onExtract(batting, bowling, fielding);
    } catch (error) {
      alert("Error processing PDFs: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xs md:max-w-xl mx-auto p-4 md:p-8 bg-white/70 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-blue-200 flex flex-col gap-4 md:gap-6 items-center animate-fade-in">
      <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
        <MdSportsCricket className="text-3xl md:text-4xl text-green-600 drop-shadow-lg" />
        <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-green-700 via-blue-600 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg tracking-tight">Upload Leaderboard PDFs</h2>
      </div>
      <div className="w-full flex flex-col gap-6">
        <section className="flex flex-col gap-2 bg-blue-50 rounded-2xl p-4 shadow">
          <label className="flex items-center gap-2 font-bold text-blue-700 text-lg mb-1">
            <MdUploadFile className="text-2xl text-blue-400" /> Batting PDF
          </label>
          <input type="file" accept="application/pdf" onChange={e => setBattingFile(e.target.files[0])}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 transition" />
        </section>
        <section className="flex flex-col gap-2 bg-green-50 rounded-2xl p-4 shadow">
          <label className="flex items-center gap-2 font-bold text-green-700 text-lg mb-1">
            <MdUploadFile className="text-2xl text-green-400" /> Bowling PDF
          </label>
          <input type="file" accept="application/pdf" onChange={e => setBowlingFile(e.target.files[0])}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200 transition" />
        </section>
        <section className="flex flex-col gap-2 bg-yellow-50 rounded-2xl p-4 shadow">
          <label className="flex items-center gap-2 font-bold text-yellow-700 text-lg mb-1">
            <MdUploadFile className="text-2xl text-yellow-400" /> Fielding PDF
          </label>
          <input type="file" accept="application/pdf" onChange={e => setFieldingFile(e.target.files[0])}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200 transition" />
        </section>
        <button
          onClick={handleParseAll}
          disabled={loading || !(battingFile && bowlingFile && fieldingFile)}
          className={`mt-2 px-6 py-3 rounded-full text-xl font-bold shadow-lg transition-all duration-200 border-2 flex items-center justify-center gap-2
            ${loading || !(battingFile && bowlingFile && fieldingFile)
              ? 'bg-gray-300 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 via-blue-500 to-yellow-400 text-white border-blue-400 hover:scale-105 hover:shadow-2xl'}
          `}
        >
          {loading ? (
            <span className="flex items-center gap-2 animate-pulse">
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              Processing...
            </span>
          ) : (
            <><MdOutlineFileDownload className="text-2xl" /> Submit</>
          )}
        </button>
      </div>
    </div>
  );
}
