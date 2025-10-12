"use client";
import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Constants for community-based spreading
const INTRA_CLUSTER_PROB = 0.9; // 90% chance to connect within cluster
const INTER_CLUSTER_INFECTION_FACTOR = 0.1; // Infection less likely between clusters

const EpidemicGraph = () => {
  const svgRef = useRef(null);
  const [numNodes, setNumNodes] = useState(500);
  const [numClusters, setNumClusters] = useState(4); // New: Number of communities
  const [infectionRate, setInfectionRate] = useState(0.01);
  const [recoveryRate, setRecoveryRate] = useState(0.01);
  const [fatalityRate, setFatalityRate] = useState(0.005); // New: Fatality Rate
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [stats, setStats] = useState({ S: 0, I: 0, R: 0, D: 0 }); // Updated: Added D
  const [history, setHistory] = useState([]);
  const [showChart, setShowChart] = useState(false);

  const generateGraph = () => {
    // 1. Assign nodes to clusters
    const nodes = Array.from({ length: numNodes }, (_, i) => ({
      id: i,
      status: i < 1 ? "I" : "S", // Start with 1 infected node
      cluster: i % numClusters, // Simple cluster assignment
      x: Math.random() * 800,
      y: Math.random() * 600,
      initialId: i, // Keep track of original ID for link generation logic
    }));

    const links = [];
    const maxDegree = 4; // Max connections per node for initial setup

    // 2. Generate links with community preference (preferential attachment within cluster)
    for (let i = 1; i < nodes.length; i++) {
        const currentNode = nodes[i];
        const sameClusterNodes = nodes.slice(0, i).filter(n => n.cluster === currentNode.cluster);
        const otherClusterNodes = nodes.slice(0, i).filter(n => n.cluster !== currentNode.cluster);

        let connectionsMade = 0;

        // Try to connect within cluster
        const numIntraConnections = Math.min(
            Math.floor(Math.random() * maxDegree) + 1,
            sameClusterNodes.length
        );

        d3.shuffle(sameClusterNodes).slice(0, numIntraConnections).forEach(targetNode => {
            links.push({ source: currentNode.id, target: targetNode.id });
            connectionsMade++;
        });

        // Add a few connections outside the cluster
        const remainingConnections = maxDegree - connectionsMade;
        const numInterConnections = Math.min(
            remainingConnections,
            Math.floor(Math.random() * 2), // 0 or 1 inter-cluster links
            otherClusterNodes.length
        );

        d3.shuffle(otherClusterNodes).slice(0, numInterConnections).forEach(targetNode => {
            links.push({ source: currentNode.id, target: targetNode.id });
        });
    }

    const initialStats = calculateStats(nodes);
    setGraphData({ nodes, links });
    setStats(initialStats);
    setTime(0);
    setHistory([{ time: 0, ...initialStats }]);
  };

  const calculateStats = (nodes) => {
    // Updated: Added D for Deceased
    const counts = { S: 0, I: 0, R: 0, D: 0 };
    nodes.forEach((node) => counts[node.status]++);
    // Note: Deceased nodes are removed from the nodes array, so D count comes from the history's previous D count + newly deceased.
    // For a clean SIRD count from active nodes, we only count S, I, R here. D is calculated in runSimulationStep.
    return counts;
  };

  const runSimulationStep = () => {
    setGraphData((prev) => {
      let newNodes = [...prev.nodes];
      let newLinks = [...prev.links];
      const newlyDeceasedIds = [];

      newNodes.forEach((node) => {
        if (node.status === "I") {
          // 1. Potential Death
          if (Math.random() < fatalityRate) {
            node.status = "D";
            newlyDeceasedIds.push(node.id);
            return; // Node dies, can't spread or recover this step
          }

          // 2. Potential Spread
          const neighbors = new Set();
          prev.links.forEach((link) => {
            // Safely get ID from source/target object or ID value
            const sourceId =
              typeof link.source === "object" ? link.source.id : link.source;
            const targetId =
              typeof link.target === "object" ? link.target.id : link.target;

            if (sourceId === node.id) neighbors.add(targetId);
            if (targetId === node.id) neighbors.add(sourceId);
          });

          neighbors.forEach((neighborId) => {
            const neighbor = newNodes.find((n) => n.id === neighborId);
            if (neighbor?.status === "S") {
                // Check if neighbor is in the same cluster
                const isSameCluster = neighbor.cluster === node.cluster;
                let infectionChance = infectionRate;

                // Reduce infection chance if nodes are in different clusters
                if (!isSameCluster) {
                    infectionChance *= INTER_CLUSTER_INFECTION_FACTOR;
                }

                if (Math.random() < infectionChance) {
                    neighbor.status = "I";
                }
            }
          });

          // 3. Potential Recovery (only if not deceased)
          if (Math.random() < recoveryRate) {
            node.status = "R";
          }
        }
      });
      
      // 4. Dynamic Removal of Deceased Nodes and their links
      if (newlyDeceasedIds.length > 0) {
        newNodes = newNodes.filter(n => !newlyDeceasedIds.includes(n.id));
        newLinks = newLinks.filter(link => 
            !newlyDeceasedIds.includes(typeof link.source === "object" ? link.source.id : link.source) &&
            !newlyDeceasedIds.includes(typeof link.target === "object" ? link.target.id : link.target)
        );
      }
      
      const currentActiveStats = calculateStats(newNodes.filter(n => n.status !== 'D')); // Count S, I, R
      const newTime = time + 1;
      
      // Calculate total Deceased (D) count
      const totalDeceased = (history.length > 0 ? history[history.length - 1].D : 0) + newlyDeceasedIds.length;
      const newStats = { ...currentActiveStats, D: totalDeceased };

      setStats(newStats);
      setTime(newTime);
      setHistory(prev => [...prev, { time: newTime, ...newStats }]);
      
      // Need to re-run the D3 simulation to update positions of remaining nodes
      return { nodes: newNodes, links: newLinks };
    });
  };

  const chartData = {
    labels: history.map(point => point.time),
    datasets: [
      {
        label: 'Susceptible',
        data: history.map(point => point.S),
        borderColor: '#3B82F6', 
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1
      },
      {
        label: 'Infected',
        data: history.map(point => point.I),
        borderColor: '#EF4444', 
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1
      },
      {
        label: 'Recovered',
        data: history.map(point => point.R),
        borderColor: '#10B981', 
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1
      },
      // New: Deceased dataset
      {
        label: 'Deceased',
        data: history.map(point => point.D),
        borderColor: '#4B5563', 
        backgroundColor: 'rgba(75, 85, 99, 0.1)',
        tension: 0.1,
        borderDash: [5, 5] // Differentiate with a dashed line
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
        text: 'SIRD Model Progression',
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

  // Re-generate graph when numNodes or numClusters changes
  useEffect(() => {
    // Ensure at least 1 cluster
    if (numClusters < 1) setNumClusters(1);
    generateGraph();
  }, [numNodes, numClusters]); 

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(runSimulationStep, 100);
    return () => clearInterval(interval);
  }, [isRunning, infectionRate, recoveryRate, fatalityRate]); // Added fatalityRate

  useEffect(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;

    // Use a key function on data() to manage dynamic node removal for D3
    const simulation = d3
      .forceSimulation(graphData.nodes)
      .force(
        "link",
        d3
          .forceLink(graphData.links)
          .id((d) => d.id)
          .distance(20) // Increased distance for better cluster visibility
      )
      .force("charge", d3.forceManyBody().strength(-2000/numNodes * numClusters)) // Adjusted strength
      .force("center", d3.forceCenter(width / 1.7, height / 2.7));

    const link = svg
      .append("g")
      .attr("stroke", "#9CA3AF")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graphData.links, d => `${d.source.id}-${d.target.id}`) // Key for stable links
      .join("line")
      .attr("stroke-width", 1);

    const node = svg
      .append("g")
      .selectAll("circle")
      .data(graphData.nodes, d => d.id) // Key for stable nodes
      .join("circle")
      .attr("r", 4)
      .attr("fill", (d) => {
        switch (d.status) {
          case "I":
            return "#EF4444"; 
          case "R":
            return "#10B981"; 
          case "D":
            return "#4B5563"; // New: Deceased color (dark gray)
          default:
            return "#3B82F6"; 
        }
      })
      .attr("stroke", d => {
          // Visual cue for cluster membership
          const colors = ["#FBBF24", "#A78BFA", "#F472B6", "#4C1D95", "#06B6D4"];
          return colors[d.cluster % colors.length];
      })
      .attr("stroke-width", 2);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    });

    return () => simulation.stop();
  }, [graphData]); // Rerender when graphData changes

  const remainingNodes = numNodes - stats.D; // Total nodes currently visible

  return (
    <div className="h-screen w-screen">
      <h1 className="text-3xl font-bold text-center p-4 text-white">
        SIRD Epidemic Simulation with Community Clusters
      </h1>
      <div className="flex flex-row w-screen justify-center">
        <div className="flex flex-col w-1/4 justify-between p-5 space-y-4">
          
          {/* New: Clusters Input */}
          <div className="bg-neutral-800 p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-white mb-1">
              Number of Clusters
            </label>
            <input
              type="number"
              value={numClusters}
              onChange={(e) =>
                setNumClusters(Math.max(1, parseInt(e.target.value)))
              }
              className="w-full px-3 py-2 bg-neutral-700 rounded-md text-white"
              min="1"
              max="10"
            />
          </div>

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
              className="w-full px-3 py-2 bg-neutral-700 rounded-md text-white"
              min="1"
              max="700"
            />
          </div>

          <div className="bg-neutral-800 p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-white mb-1">
              Infection Rate (Intra-cluster)
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
          
          {/* New: Fatality Rate Input */}
          <div className="bg-neutral-800 p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-white mb-1">
              Fatality Rate (D)
            </label>
            <input
              type="range"
              min="0"
              max="0.05"
              step="0.001"
              value={fatalityRate}
              onChange={(e) => setFatalityRate(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-white">
              {fatalityRate.toFixed(3)}
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
          </div>

          <button
            onClick={() => setShowChart(!showChart)}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-md mt-4"
          >
            {showChart ? "Hide Chart" : "Plot Chart"}
          </button>
        </div>

        <div className="flex flex-col justify-between w-3/4 h-3/4 p-5 gap-4 ">
          <div className="rounded-lg shadow h-full">
            <svg
              scale={0.1}
              ref={svgRef}
              width="100%"
              height="500"
              className="bg-neutral-800 rounded-lg"
            ></svg>
          </div>

          {showChart && (
            <div className="bg-neutral-800 p-4 rounded-lg shadow">
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
          
          {/* Updated Grid for SIRD stats */}
          <div className="grid grid-cols-4 gap-4"> 
            {/* S - Susceptible */}
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

            {/* I - Infected */}
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

            {/* R - Recovered */}
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

            {/* D - Deceased (New) */}
            <div className="bg-gray-700 p-4 rounded-lg shadow">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
                <span className="font-medium">Deceased (D)</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {numNodes - (stats.S + stats.I + stats.R  )}{" "}
                <span className="text-sm text-gray-200">
                  ({((stats.D / numNodes) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
          <div className="text-center text-sm text-gray-400">
              Total Initial Nodes: {numNodes} | Remaining Active Nodes: {numNodes - (stats.S + stats.I + stats.R  )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpidemicGraph;