// Hand-rolled SVG chart: H0 vs publication year, with vertical error bars.
// No charting library — the data is a handful of points with error bars,
// well within what plain SVG + a scale function can do, so a dependency
// isn't justified.

import { FAMILY_COLORS, FAMILY_LABELS } from "./constants.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const WIDTH = 800;
const HEIGHT = 440;
const MARGIN = { top: 24, right: 32, bottom: 56, left: 64 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

// Generic "nice" tick step chooser (used for the H0 axis).
function niceTicks(min, max, count) {
  const span = max - min || 1;
  const rawStep = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / mag;
  let step;
  if (residual > 5) step = 10 * mag;
  else if (residual > 2) step = 5 * mag;
  else step = 2 * mag;

  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + 1e-9; v += step) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  return ticks;
}

// Year ticks stay integers regardless of span (fractional years read oddly).
function yearTicks(minYear, maxYear, targetCount = 6) {
  const span = Math.max(1, maxYear - minYear);
  const step = Math.max(1, Math.ceil(span / targetCount));
  const start = Math.ceil(minYear / step) * step;
  const ticks = [];
  for (let y = start; y <= maxYear; y += step) ticks.push(y);
  if (ticks.length === 0) ticks.push(Math.round((minYear + maxYear) / 2));
  return ticks;
}

function formatUncertainty(m) {
  if (m.uncertainty_plus === m.uncertainty_minus) {
    return `± ${m.uncertainty_plus}`;
  }
  return `+${m.uncertainty_plus} / -${m.uncertainty_minus}`;
}

function tooltipHTML(m) {
  const link = `https://arxiv.org/abs/${m.arxiv}`;
  return `
    <div class="tooltip-collab">${m.collaboration} (${m.year})</div>
    <div class="tooltip-value">${m.value} ${formatUncertainty(m)} km/s/Mpc</div>
    <div class="tooltip-technique">${m.technique}</div>
    <a class="tooltip-link" href="${link}" target="_blank" rel="noopener noreferrer">arXiv:${m.arxiv}</a>
  `;
}

function setupTooltip(container) {
  const tooltip = document.createElement("div");
  tooltip.className = "chart-tooltip";
  tooltip.hidden = true;
  container.appendChild(tooltip);

  let hideTimer = null;

  function show(point, m) {
    clearTimeout(hideTimer);
    tooltip.innerHTML = tooltipHTML(m);
    tooltip.hidden = false;

    const containerRect = container.getBoundingClientRect();
    const pointRect = point.getBoundingClientRect();
    const left = pointRect.left - containerRect.left + pointRect.width / 2;
    const top = pointRect.top - containerRect.top;

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function scheduleHide() {
    hideTimer = setTimeout(() => {
      tooltip.hidden = true;
    }, 150);
  }

  tooltip.addEventListener("mouseenter", () => clearTimeout(hideTimer));
  tooltip.addEventListener("mouseleave", scheduleHide);

  return { show, scheduleHide };
}

export function renderChart(container, measurements) {
  container.innerHTML = "";

  if (measurements.length === 0) {
    const empty = document.createElement("p");
    empty.className = "chart-empty";
    empty.textContent = "No measurements in the dataset yet.";
    container.appendChild(empty);
    return;
  }

  const years = measurements.map((m) => m.year);
  const lows = measurements.map((m) => m.value - m.uncertainty_minus);
  const highs = measurements.map((m) => m.value + m.uncertainty_plus);

  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const yearSpan = maxYear - minYear;
  const yearPad = yearSpan === 0 ? 1 : Math.max(yearSpan * 0.15, 0.5);
  const xDomain = [minYear - yearPad, maxYear + yearPad];

  const minVal = Math.min(...lows);
  const maxVal = Math.max(...highs);
  const valSpan = maxVal - minVal;
  const valPad = Math.max(valSpan * 0.15, 2);
  const yDomain = [minVal - valPad, maxVal + valPad];

  const xScale = (year) =>
    MARGIN.left +
    ((year - xDomain[0]) / (xDomain[1] - xDomain[0])) * PLOT_WIDTH;
  const yScale = (val) =>
    MARGIN.top +
    PLOT_HEIGHT -
    ((val - yDomain[0]) / (yDomain[1] - yDomain[0])) * PLOT_HEIGHT;

  const svg = svgEl("svg", {
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    class: "chart-svg",
    role: "img",
    "aria-label": "H0 measurements by publication year, with error bars",
  });

  // Axes
  svg.appendChild(
    svgEl("line", {
      x1: MARGIN.left,
      y1: MARGIN.top + PLOT_HEIGHT,
      x2: MARGIN.left + PLOT_WIDTH,
      y2: MARGIN.top + PLOT_HEIGHT,
      class: "axis-line",
    })
  );
  svg.appendChild(
    svgEl("line", {
      x1: MARGIN.left,
      y1: MARGIN.top,
      x2: MARGIN.left,
      y2: MARGIN.top + PLOT_HEIGHT,
      class: "axis-line",
    })
  );

  // X ticks (years)
  for (const year of yearTicks(xDomain[0], xDomain[1])) {
    const x = xScale(year);
    svg.appendChild(
      svgEl("line", {
        x1: x,
        y1: MARGIN.top + PLOT_HEIGHT,
        x2: x,
        y2: MARGIN.top + PLOT_HEIGHT + 6,
        class: "tick-line",
      })
    );
    const label = svgEl("text", {
      x,
      y: MARGIN.top + PLOT_HEIGHT + 22,
      class: "tick-label",
      "text-anchor": "middle",
    });
    label.textContent = year;
    svg.appendChild(label);
  }
  const xAxisTitle = svgEl("text", {
    x: MARGIN.left + PLOT_WIDTH / 2,
    y: HEIGHT - 6,
    class: "axis-title",
    "text-anchor": "middle",
  });
  xAxisTitle.textContent = "Publication year";
  svg.appendChild(xAxisTitle);

  // Y ticks (H0 values)
  for (const val of niceTicks(yDomain[0], yDomain[1], 5)) {
    const y = yScale(val);
    svg.appendChild(
      svgEl("line", {
        x1: MARGIN.left - 6,
        y1: y,
        x2: MARGIN.left,
        y2: y,
        class: "tick-line",
      })
    );
    const label = svgEl("text", {
      x: MARGIN.left - 10,
      y: y + 4,
      class: "tick-label",
      "text-anchor": "end",
    });
    label.textContent = val;
    svg.appendChild(label);
  }
  const yAxisTitle = svgEl("text", {
    x: -(MARGIN.top + PLOT_HEIGHT / 2),
    y: 16,
    class: "axis-title",
    "text-anchor": "middle",
    transform: "rotate(-90)",
  });
  yAxisTitle.textContent = "H₀ (km/s/Mpc)";
  svg.appendChild(yAxisTitle);

  // Points + error bars
  for (const m of measurements) {
    const x = xScale(m.year);
    const yValue = yScale(m.value);
    const yHigh = yScale(m.value + m.uncertainty_plus);
    const yLow = yScale(m.value - m.uncertainty_minus);
    const color = FAMILY_COLORS[m.family];
    const capWidth = 5;

    const paperUrl = `https://arxiv.org/abs/${m.arxiv}`;

    const group = svgEl("g", {
      class: "point-group",
      tabindex: "0",
      role: "button",
      "aria-label": `${m.collaboration}, ${m.value} ${formatUncertainty(
        m
      )} km/s/Mpc, ${m.technique}, ${m.year} — opens arXiv:${
        m.arxiv
      } in a new tab`,
    });

    group.appendChild(
      svgEl("line", {
        x1: x,
        y1: yHigh,
        x2: x,
        y2: yLow,
        class: "error-bar",
        stroke: color,
      })
    );
    group.appendChild(
      svgEl("line", {
        x1: x - capWidth,
        y1: yHigh,
        x2: x + capWidth,
        y2: yHigh,
        class: "error-cap",
        stroke: color,
      })
    );
    group.appendChild(
      svgEl("line", {
        x1: x - capWidth,
        y1: yLow,
        x2: x + capWidth,
        y2: yLow,
        class: "error-cap",
        stroke: color,
      })
    );
    group.appendChild(
      svgEl("circle", {
        cx: x,
        cy: yValue,
        r: 6,
        class: "point",
        fill: color,
      })
    );

    const title = svgEl("title");
    title.textContent = `${m.collaboration} (${m.year}): ${m.value} ${formatUncertainty(
      m
    )} km/s/Mpc — ${m.technique}`;
    group.appendChild(title);

    svg.appendChild(group);

    const tooltip = container._tooltip;
    group.addEventListener("mouseenter", () => tooltip.show(group, m));
    group.addEventListener("mouseleave", () => tooltip.scheduleHide());
    group.addEventListener("focus", () => tooltip.show(group, m));
    group.addEventListener("blur", () => tooltip.scheduleHide());

    // The point itself is the primary way to reach the source paper —
    // tooltips can't reliably hold a clickable link on touch/hover-averse
    // devices, so clicking (or Enter/Space when focused) opens it directly.
    group.addEventListener("click", () => {
      window.open(paperUrl, "_blank", "noopener,noreferrer");
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.open(paperUrl, "_blank", "noopener,noreferrer");
      }
    });
  }

  container.appendChild(svg);
}

export function renderLegend(container) {
  container.innerHTML = "";
  for (const family of Object.keys(FAMILY_COLORS)) {
    const item = document.createElement("span");
    item.className = "legend-item";

    const swatch = document.createElement("span");
    swatch.className = "legend-swatch";
    swatch.style.backgroundColor = FAMILY_COLORS[family];

    const label = document.createElement("span");
    label.textContent = FAMILY_LABELS[family];

    item.appendChild(swatch);
    item.appendChild(label);
    container.appendChild(item);
  }
}

export function initChartTooltip(container) {
  container._tooltip = setupTooltip(container);
}

// --- σ-tension calculator ---
// Naive pairwise tension: |value_a - value_b| / sqrt(sigma_a^2 + sigma_b^2).
// This assumes independence — see the caveat text rendered alongside it.

// uncertainty_plus and uncertainty_minus are currently always equal in the
// dataset, but averaging them keeps this correct if an asymmetric entry
// is ever added.
function symmetricUncertainty(m) {
  return (m.uncertainty_plus + m.uncertainty_minus) / 2;
}

export function computeTensionSigma(a, b) {
  const sigmaA = symmetricUncertainty(a);
  const sigmaB = symmetricUncertainty(b);
  return Math.abs(a.value - b.value) / Math.sqrt(sigmaA ** 2 + sigmaB ** 2);
}

function measurementLabel(m) {
  return `${m.collaboration} (${m.year})`;
}

function buildMeasurementSelect(measurements, defaultId) {
  const select = document.createElement("select");
  select.className = "tension-select";
  for (const m of measurements) {
    const option = optionEl(m.id, measurementLabel(m));
    select.appendChild(option);
  }
  const hasDefault = measurements.some((m) => m.id === defaultId);
  select.value = hasDefault ? defaultId : measurements[0].id;
  return select;
}

function optionEl(value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
}

export function renderTensionCalculator(container, measurements) {
  container.innerHTML = "";

  if (measurements.length < 2) {
    const empty = document.createElement("p");
    empty.className = "chart-empty";
    empty.textContent = "Need at least two measurements to compare.";
    container.appendChild(empty);
    return;
  }

  const heading = document.createElement("h2");
  heading.textContent = "σ-tension calculator";
  container.appendChild(heading);

  const controls = document.createElement("div");
  controls.className = "tension-controls";

  const fieldA = document.createElement("label");
  fieldA.className = "tension-field";
  fieldA.appendChild(document.createTextNode("Measurement A"));
  const selectA = buildMeasurementSelect(measurements, "shoes-2024");
  fieldA.appendChild(selectA);

  const vs = document.createElement("span");
  vs.className = "tension-vs";
  vs.textContent = "vs";

  const fieldB = document.createElement("label");
  fieldB.className = "tension-field";
  fieldB.appendChild(document.createTextNode("Measurement B"));
  const selectB = buildMeasurementSelect(measurements, "planck-2018");
  fieldB.appendChild(selectB);

  controls.appendChild(fieldA);
  controls.appendChild(vs);
  controls.appendChild(fieldB);
  container.appendChild(controls);

  const result = document.createElement("p");
  result.className = "tension-result";
  container.appendChild(result);

  const caveat = document.createElement("p");
  caveat.className = "tension-caveat";
  caveat.textContent =
    "This is a simplified estimate: it assumes the two measurements are " +
    "statistically independent. Some pairs (e.g. SH0ES and CCHP) share " +
    "calibration steps, so their true combined tension differs from this " +
    "naive value — this is not a rigorous joint analysis.";
  container.appendChild(caveat);

  function update() {
    const a = measurements.find((m) => m.id === selectA.value);
    const b = measurements.find((m) => m.id === selectB.value);

    if (!a || !b || a.id === b.id) {
      result.textContent = "Select two different measurements to compare.";
      return;
    }

    const sigma = computeTensionSigma(a, b);
    result.textContent = `${a.collaboration} vs ${b.collaboration}: ${sigma.toFixed(
      1
    )}σ`;
  }

  selectA.addEventListener("change", update);
  selectB.addEventListener("change", update);
  update();
}
