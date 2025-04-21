"use client";
import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const EpidemicGraph = () => {
  const svgRef = useRef(null);
  const [numNodes, setNumNodes] = useState(500);
  const [infectionRate, setInfectionRate] = useState(0.01);
  const [recoveryRate, setRecoveryRate] = useState(0.01);
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [stats, setStats] = useState({ S: 0, I: 0, R: 0 });
  const [history, setHistory] = useState([]);
  const [showChart, setShowChart] = useState(false);

  // Generate graph data
  const generateGraph = () => {
    const nodes = Array.from({ length: numNodes }, (_, i) => ({
      id: i,
      status: i < 1 ? "I" : "S",
      x: Math.random() * 800,
      y: Math.random() * 600,
    }));

    const links = [];
    for (let i = 1; i < nodes.length; i++) {
      const numConnections = Math.min(Math.floor(Math.random() * 3) + 1, i);
      const targets = d3
        .shuffle(Array.from({ length: i }, (_, j) => j))
        .slice(0, numConnections);

      targets.forEach((target) => {
        links.push({ source: i, target: target });
      });
    }

    const initialStats = calculateStats(nodes);
    setGraphData({ nodes, links });
    setStats(initialStats);
    setTime(0);
    setHistory([{ time: 0, ...initialStats }]); // Initialize history with first data point
  };

  // Calculate statistics
  const calculateStats = (nodes) => {
    const counts = { S: 0, I: 0, R: 0 };
    nodes.forEach((node) => counts[node.status]++);
    return counts;
  };

  // Run simulation step
  const runSimulationStep = () => {
    setGraphData((prev) => {
      const newNodes = [...prev.nodes];
      const newLinks = [...prev.links];

      // Spread infection
      newNodes.forEach((node) => {
        if (node.status === "I") {
          // Find neighbors
          const neighbors = new Set();
          prev.links.forEach((link) => {
            const sourceId =
              typeof link.source === "object" ? link.source.id : link.source;
            const targetId =
              typeof link.target === "object" ? link.target.id : link.target;

            if (sourceId === node.id) neighbors.add(targetId);
            if (targetId === node.id) neighbors.add(sourceId);
          });

          // Infect neighbors
          neighbors.forEach((neighborId) => {
            const neighbor = newNodes.find((n) => n.id === neighborId);
            if (neighbor?.status === "S" && Math.random() < infectionRate) {
              neighbor.status = "I";
            }
          });

          // Recover
          if (Math.random() < recoveryRate) {
            node.status = "R";
          }
        }
      });

      const newStats = calculateStats(newNodes);
      const newTime = time + 1;
      
      setStats(newStats);
      setTime(newTime);
      
      // Update history
      setHistory(prev => [...prev, { time: newTime, ...newStats }]);
      
      return { nodes: newNodes, links: newLinks };
    });
  };

  // Prepare data for the chart
  const chartData = {
    labels: history.map(point => point.time),
    datasets: [
      {
        label: 'Susceptible',
        data: history.map(point => point.S),
        borderColor: '#3B82F6', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1
      },
      {
        label: 'Infected',
        data: history.map(point => point.I),
        borderColor: '#EF4444', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1
      },
      {
        label: 'Recovered',
        data: history.map(point => point.R),
        borderColor: '#10B981', // green-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'SIR Model Progression',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Individuals'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time Steps'
        }
      }
    }
  };

  // Initialize graph
  useEffect(() => {
    generateGraph();
  }, [numNodes]);

  // Run simulation when started
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(runSimulationStep, 100);
    return () => clearInterval(interval);
  }, [isRunning, infectionRate, recoveryRate]);

  // Draw graph with D3
  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;

    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d) => d.id)
          .distance(1)
      )
      .force("charge", d3.forceManyBody().strength(-5000/numNodes))
      .force("center", d3.forceCenter(width / 1.7, height / 2.7));

    // Draw links
    const link = svg
      .append("g")
      .selectAll("line")
      .data(graphData.links)
      .enter()
      .append("line")
      .attr("stroke", "#9CA3AF")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1);

    // Draw nodes
    const node = svg
      .append("g")
      .selectAll("circle")
      .data(graphData.nodes)
      .enter()
      .append("circle")
      .attr("r", 4)
      .attr("fill", (d) => {
        switch (d.status) {
          case "I":
            return "#EF4444"; // red-700
          case "R":
            return "#10B981"; // emerald-700
          default:
            return "#3B82F6"; // blue-700
        }
      });

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    });

    return () => simulation.stop();
  }, [graphData]);

  return (
    <div className="h-screen w-screen">
      <h1 className="text-3xl font-bold text-center">
        Epidemic Graph Simulation
      </h1>
      <div className="flex flex-row w-screen justify-center">
        <div className="flex flex-col w-1/4 justify-between p-5">
          <div className="bg-neutral-800 p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-white mb-1">
              Nodes
            </label>
            <input
              type="number"
              value={numNodes}
              onChange={(e) =>
                setNumNodes(Math.max(1, parseInt(e.target.value)))
              }
              className="w-full px-3 py-2 bg-neutral-700 rounded-md"
              min="1"
              max="700"
            />
          </div>

          <div className="bg-neutral-800 p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-white mb-1">
              Infection Rate
            </label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={infectionRate}
              onChange={(e) => setInfectionRate(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-white">
              {infectionRate.toFixed(2)}
            </span>
          </div>

          <div className="bg-neutral-800 p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-white mb-1">
              Recovery Rate
            </label>
            <input
              type="range"
              min="0"
              max="0.1"
              step="0.001"
              value={recoveryRate}
              onChange={(e) => setRecoveryRate(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-white">
              {recoveryRate.toFixed(3)}
            </span>
          </div>

          <div className="bg-neutral-800 p-4 rounded-lg shadow flex flex-col">
            <div className="flex space-x-4 mb-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-4 py-2 rounded-md ${
                  isRunning
                    ? "bg-yellow-700 hover:bg-yellow-600"
                    : "bg-green-700 hover:bg-green-600"
                } text-white`}
              >
                {isRunning ? "Pause" : "Start"}
              </button>
              <button
                onClick={generateGraph}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-md"
              >
                Reset
              </button>
            </div>
            {/* <div className="text-sm text-white">Time: {time}</div> */}
          </div>

          {/* Add Plot Graph button */}
          <button
            onClick={() => setShowChart(!showChart)}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-md mt-4"
          >
            {showChart ? "Hide Graph" : "Plot Graph"}
          </button>
        </div>
        <div className="flex flex-col justify-between w-3/4 h-3/4 p-5 gap-4 ">
          <div className="rounded-lg shadow h-full">
            <svg
              scale={0.1}
              ref={svgRef}
              width="100%"
              height="400"
              className="bg-neutral-800 rounded-lg"
            ></svg>
          </div>
          
          {/* Conditionally render the chart */}
          {showChart && (
            <div className="bg-neutral-800 p-4 rounded-lg shadow">
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-900 p-4 rounded-lg shadow ">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-700 rounded-full mr-2"></div>
                <span className="font-medium">Susceptible</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {stats.S}{" "}
                <span className="text-sm text-gray-200">
                  ({((stats.S / numNodes) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="bg-red-900 p-4 rounded-lg shadow ">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-700 rounded-full mr-2"></div>
                <span className="font-medium">Infected</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {stats.I}{" "}
                <span className="text-sm text-gray-200">
                  ({((stats.I / numNodes) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="bg-green-900 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-700 rounded-full mr-2"></div>
                <span className="font-medium">Recovered</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {stats.R}{" "}
                <span className="text-sm text-gray-200">
                  ({((stats.R / numNodes) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpidemicGraph;