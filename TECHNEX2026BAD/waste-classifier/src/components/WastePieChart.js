import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { IMPACT } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function WastePieChart({ records }) {
  const counts = useMemo(() => {
    const c = { Recyclable: 0, Biodegradable: 0, Hazardous: 0 };
    records.forEach(r => { if (c[r.category] !== undefined) c[r.category]++; });
    return c;
  }, [records]);

  const data = {
    labels: ['Recyclable', 'Biodegradable', 'Hazardous'],
    datasets: [{
      data: [counts.Recyclable, counts.Biodegradable, counts.Hazardous],
      backgroundColor: [
        IMPACT.Recyclable.color,
        IMPACT.Biodegradable.color,
        IMPACT.Hazardous.color,
      ],
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          font: { family: "'Inter', sans-serif", size: 13 },
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.label}: ${ctx.parsed} items (${Math.round((ctx.parsed / records.length) * 100)}%)`,
        },
      },
    },
  };

  if (!records.length) return <p style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px' }}>No data</p>;

  return <Pie data={data} options={options} />;
}
