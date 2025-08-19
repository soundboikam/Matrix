"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, TimeScale, Tooltip, Filler);

export default function ArtistChart({ points }: { points: { x: string; y: number }[] }) {
 const data = {
   labels: points.map(p => p.x),
   datasets: [{
     label: "Streams",
     data: points.map(p => p.y),
     fill: true,
     borderColor: "rgba(255,255,255,0.9)",
     backgroundColor: "rgba(255,255,255,0.08)",
     pointRadius: 2,
     tension: 0.25,
   }],
 };
 const options: any = {
   responsive: true,
   maintainAspectRatio: false,
   plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
   scales: {
     x: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.06)" } },
     y: { ticks: { color: "#aaa" }, grid: { color: "rgba(255,255,255,0.06)" } },
   },
 };
 return <div style={{ height: 260 }}><Line data={data} options={options} /></div>;
}


