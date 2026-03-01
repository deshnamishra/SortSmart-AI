import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
  }
  return days;
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth()    === d2.getMonth() &&
         d1.getDate()     === d2.getDate();
}

export default function DailyBarChart({ records }) {
  const labels = useMemo(() => getLast7Days(), []);

  const { recyclable, biodegradable, hazardous } = useMemo(() => {
    const r = Array(7).fill(0);
    const b = Array(7).fill(0);
    const h = Array(7).fill(0);

    records.forEach(rec => {
      const recDate = new Date(rec.timestamp);
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        if (isSameDay(recDate, d)) {
          if (rec.category === 'Recyclable')    r[i]++;
          else if (rec.category === 'Biodegradable') b[i]++;
          else if (rec.category === 'Hazardous')     h[i]++;
          break;
        }
      }
    });
    return { recyclable: r, biodegradable: b, hazardous: h };
  }, [records]);

  const data = {
    labels,
    datasets: [
      { label: 'Recyclable',    data: recyclable,    backgroundColor: '#3a86ff', borderRadius: 4 },
      { label: 'Biodegradable', data: biodegradable, backgroundColor: '#40916c', borderRadius: 4 },
      { label: 'Hazardous',     data: hazardous,     backgroundColor: '#e63946', borderRadius: 4 },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: "'Inter', sans-serif", size: 11 },
          padding: 12,
          usePointStyle: true,
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0 },
        grid: { color: '#f0f0f0' },
      },
    },
  };

  if (!records.length) return <p style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px' }}>No data</p>;

  return <Bar data={data} options={options} />;
}
