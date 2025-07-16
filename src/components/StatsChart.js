import React from 'react';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

export default function StatsChart({ player }) {

    console.log(player);
  // Batting Pie
  const battingPieData = {
    labels: ['Runs', 'Fours', 'Sixes', 'Balls'],
    datasets: [
      {
        data: [
          player.batting.runs || 0,
          player.batting.fours || 0,
          player.batting.sixes || 0,
          player.batting.balls || 0
        ],
        backgroundColor: [
          'rgba(59,130,246,0.8)', // blue
          'rgba(236,72,153,0.8)', // pink
          'rgba(251,191,36,0.8)', // yellow
          'rgba(139,92,246,0.8)'  // purple
        ],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8
      }
    ]
  };

  // Batting Bar
  const battingBarData = {
    labels: ['Innings', 'Average', 'Strike Rate', 'Not Outs'],
    datasets: [
      {
        label: 'Batting',
        data: [
          player.batting.inns || 0,
          player.batting.average || 0,
          player.batting.strikeRate || 0,
          player.batting.notOut || 0
        ],
        backgroundColor: [
          'rgba(59,130,246,0.7)',
          'rgba(236,72,153,0.7)',
          'rgba(251,191,36,0.7)',
          'rgba(139,92,246,0.7)'
        ],
        borderRadius: 8,
        maxBarThickness: 32
      }
    ]
  };

  // Batting Milestones Bar
  const battingMilestoneBarData = {
    labels: ['Fifties', 'Hundreds'],
    datasets: [
      {
        label: 'Milestones',
        data: [
          player.batting.fifties || 0,
          player.batting.hundreds || 0
        ],
        backgroundColor: [
          'rgba(251,191,36,0.8)', // yellow
          'rgba(139,92,246,0.8)'  // purple
        ],
        borderRadius: 8,
        maxBarThickness: 32
      }
    ]
  };

  // Bowling Pie
  const bowlingPieData = {
    labels: ['Wickets', 'Maidens','Overs', 'Runs Given'],
    datasets: [
      {
        data: [
          player.bowling.wickets || 0,
          player.bowling.maidens || 0,
          player.bowling.overs || 0,
          player.bowling.runs || 0
        ],
        backgroundColor: [
          'rgba(16,185,129,0.8)', // green
          'rgba(59,130,246,0.8)', // blue
          'rgba(251,191,36,0.8)', // yellow
          'rgba(239,68,68,0.8)'   // red
        ],
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 8
      }
    ]
  };

  // Bowling Bar
  const bowlingBarData = {
    labels: ['Innings', 'Economy', 'Average', 'Strike Rate'],
    datasets: [
      {
        label: 'Bowling',
        data: [
          player.bowling.inns || 0,
          player.bowling.economy || 0,
          player.bowling.average || 0,
          player.bowling.strikeRate || 0
        ],
        backgroundColor: [
          'rgba(251,191,36,0.7)',
          'rgba(16,185,129,0.7)',
          'rgba(59,130,246,0.7)',
          'rgba(239,68,68,0.7)'
        ],
        borderRadius: 8,
        maxBarThickness: 32
      }
    ]
  };

  // Fielding Bar
  const fieldingBarData = {
    labels: ['Catches', 'Run Outs', 'Stumpings', 'Brilliant'],
    datasets: [
      {
        label: 'Fielding',
        data: [
          player.fielding.catches || 0,
          player.fielding.runOuts || 0,
          player.fielding.stumpings || 0,
          parseInt(player.fielding.brilliantCatches) || 0
        ],
        backgroundColor: [
          'rgba(251,191,36,0.7)',
          'rgba(59,130,246,0.7)',
          'rgba(236,72,153,0.7)',
          'rgba(16,185,129,0.7)'
        ],
        borderRadius: 8,
        maxBarThickness: 32
      }
    ]
  };

  const pieOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { color: '#334155', font: { size: 16, weight: 'bold' } }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed}`;
          }
        }
      },
      title: { display: false }
    },
    animation: { animateRotate: true, animateScale: true }
  };

  const barOptions = {
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      title: { display: false }
    },
    scales: {
      x: {
        ticks: { color: '#334155', font: { size: 14, weight: 'bold' } },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#334155', font: { size: 14, weight: 'bold' } },
        grid: { color: 'rgba(203,213,225,0.2)' }
      }
    },
    animation: { duration: 900, easing: 'easeOutBounce' }
  };

  return (
    <div className="flex flex-col gap-8 md:gap-16 w-full max-w-full md:max-w-5xl mx-auto py-4 md:py-12 px-1 md:px-0 overflow-x-auto">
      {/* Batting */}
      <div className="w-full bg-white rounded-3xl shadow-2xl p-4 md:p-12 flex flex-col items-stretch mb-4 md:mb-8 border-t-8 border-green-300">
        <div className="text-xl md:text-3xl font-extrabold text-green-700 mb-2 md:mb-4 tracking-wide flex items-center gap-2">
          🏏 Batting Stats
        </div>
        <div className="text-base md:text-lg font-semibold text-blue-700 mb-4 md:mb-8 flex items-center gap-2 md:gap-4">
          <span>Highest Score:</span>
          <span className="text-lg md:text-2xl font-bold text-green-800 bg-green-100 px-2 md:px-4 py-1 rounded-xl shadow-inner">{player.batting.highest || '-'}</span>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:gap-12 w-full items-stretch justify-center">
          <div className="w-full md:max-w-lg bg-green-50 rounded-2xl shadow p-3 md:p-6 flex flex-col items-center overflow-visible min-h-[200px] md:min-h-[340px]">
            <div className="text-base md:text-xl font-bold text-blue-700 mb-2 md:mb-4">Breakdown</div>
            <div className="flex items-center justify-center w-full h-auto">
              <Pie data={battingPieData} options={pieOptions} />
            </div>
          </div>
          <div className="flex-1 w-full bg-green-50 rounded-2xl shadow p-3 md:p-6 overflow-visible flex flex-col min-h-[200px] md:min-h-[340px]">
            <div className="text-base md:text-xl font-bold text-blue-700 mb-2 md:mb-4">Highlights</div>
            <Bar data={battingBarData} options={barOptions} />
            <div className="mt-4 md:mt-8">
              <div className="text-base md:text-lg font-bold text-yellow-700 mb-1 md:mb-2">Milestones</div>
              <Bar data={battingMilestoneBarData} options={barOptions} />
            </div>
          </div>
        </div>
      </div>
      {/* Bowling */}
      <div className="w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 flex flex-col items-stretch mb-8 border-t-8 border-yellow-300">
        <div className="text-3xl font-extrabold text-yellow-700 mb-4 tracking-wide flex items-center gap-2">
          🏏 Bowling Stats
        </div>
        <div className="text-lg font-semibold text-green-700 mb-8 flex items-center gap-4">
          <span>Highest Wickets:</span>
          <span className="text-2xl font-bold text-yellow-800 bg-yellow-100 px-4 py-1 rounded-xl shadow-inner">{player.bowling.highest || '-'}</span>
        </div>
        <div className="flex flex-col md:flex-row gap-12 w-full items-stretch justify-center">
          <div className="w-full md:max-w-lg bg-yellow-50 rounded-2xl shadow p-6 flex flex-col items-center overflow-visible min-h-[340px]">
            <div className="text-xl font-bold text-green-700 mb-4">Breakdown</div>
            <div className="flex items-center justify-center w-full h-auto">
              <Doughnut data={bowlingPieData} options={pieOptions} />
            </div>
          </div>
          <div className="flex-1 w-full bg-yellow-50 rounded-2xl shadow p-6 overflow-visible flex flex-col min-h-[340px]">
            <div className="text-xl font-bold text-green-700 mb-4">Highlights</div>
            <Bar data={bowlingBarData} options={barOptions} />
          </div>
        </div>
      </div>
      {/* Fielding */}
      <div className="w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 flex flex-col items-stretch mb-8 border-t-8 border-blue-300">
        <div className="text-3xl font-extrabold text-blue-700 mb-8 tracking-wide flex items-center gap-2">
          🏏 Fielding Stats
        </div>
        <div className="flex flex-col gap-12 w-full items-stretch justify-center">
          <div className="w-full bg-blue-50 rounded-2xl shadow p-6 overflow-visible min-h-[260px]">
            <Bar data={fieldingBarData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
