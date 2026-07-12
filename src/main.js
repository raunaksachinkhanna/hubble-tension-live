import {
  renderChart,
  renderLegend,
  initChartTooltip,
  renderTensionCalculator,
} from "./chart.js";

async function init() {
  const chartContainer = document.getElementById("chart");
  const legendContainer = document.getElementById("legend");
  const updatedContainer = document.getElementById("last-updated");
  const tensionContainer = document.getElementById("tension-calculator");

  initChartTooltip(chartContainer);
  renderLegend(legendContainer);

  let data;
  try {
    const response = await fetch("data/measurements.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (err) {
    chartContainer.innerHTML = "";
    const errorMsg = document.createElement("p");
    errorMsg.className = "chart-empty";
    errorMsg.textContent = "Could not load measurements.json.";
    chartContainer.appendChild(errorMsg);
    console.error("Failed to load measurements:", err);
    return;
  }

  renderChart(chartContainer, data.measurements);
  renderTensionCalculator(tensionContainer, data.measurements);
  updatedContainer.textContent = `Data last updated: ${data.last_updated}`;
}

init();
