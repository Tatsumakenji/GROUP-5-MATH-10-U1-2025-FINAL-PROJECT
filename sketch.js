// Supply & Demand Simulation (Polished Version)
// Features:
// - Demand & Supply with intercept/slope + shift sliders
// - Price ceilings & floors (binding checks + shaded shortage/surplus)
// - Tax and subsidy on sellers (policy supply, wedge, tooltip)
// - Scenario presets (dropdown)
// - Animation toggle for dynamic shifts
// - Light/Dark theme toggle
// - Tooltips on hover for key points
// - Legend and info panel

let aSlider, bSlider, cSlider, dSlider;
let demandShiftSlider, supplyShiftSlider;

let ceilingCheckbox, ceilingSlider;
let floorCheckbox, floorSlider;

let taxCheckbox, taxSlider;
let subsidyCheckbox, subsidySlider;

let animateCheckbox;
let themeButton;
let scenarioSelect;
let resetButton;

let darkMode = false;

let Qmax = 20;
let Pmax = 20;
let margin = 70;

let tooltipItems = [];

function setup() {
  createCanvas(windowWidth, windowHeight - 150);
function windowResized() 
  resizeCanvas(windowWidth, windowHeight - 150);
}

  textFont("sans-serif");

  // --- Sliders for demand & supply ---
  aSlider = createSlider(10, 30, 20, 1);      // demand intercept
  bSlider = createSlider(0.5, 3, 1, 0.1);     // demand slope
  demandShiftSlider = createSlider(-5, 5, 0, 0.5);

  cSlider = createSlider(0, 15, 4, 1);        // supply intercept
  dSlider = createSlider(0.5, 3, 1, 0.1);     // supply slope
  supplyShiftSlider = createSlider(-5, 5, 0, 0.5);

  // --- Price controls ---
  ceilingCheckbox = createCheckbox("Enable price ceiling", false);
  ceilingSlider = createSlider(0, Pmax, 8, 0.5);

  floorCheckbox = createCheckbox("Enable price floor", false);
  floorSlider = createSlider(0, Pmax, 5, 0.5);

  // --- Tax & Subsidy ---
  taxCheckbox = createCheckbox("Enable tax on sellers", false);
  taxSlider = createSlider(0, 10, 2, 0.5);

  subsidyCheckbox = createCheckbox("Enable subsidy to sellers", false);
  subsidySlider = createSlider(0, 10, 2, 0.5);

  // --- Animation & Theme ---
  animateCheckbox = createCheckbox("Animate shifts over time", false);
  themeButton = createButton("Toggle Dark / Light Theme");
  themeButton.mousePressed(() => (darkMode = !darkMode));

  // --- Scenario selector & Reset ---
  scenarioSelect = createSelect();
  scenarioSelect.option("Custom / Manual", "custom");
  scenarioSelect.option("Baseline market", "baseline");
  scenarioSelect.option("Demand boom", "demand_boom");
  scenarioSelect.option("Supply shock (crop failure)", "supply_shock");
  scenarioSelect.option("Binding price ceiling", "ceiling");
  scenarioSelect.option("Binding price floor", "floor");
  scenarioSelect.option("Per-unit tax (sellers)", "tax");
  scenarioSelect.option("Per-unit subsidy (sellers)", "subsidy");
  scenarioSelect.changed(applyScenario);

  resetButton = createButton("Reset to default");
  resetButton.mousePressed(resetDefaults);

  // --- Position elements ---
  let baseY = height + 20;

  aSlider.position(20, baseY + 15);
  bSlider.position(20, baseY + 65);
  demandShiftSlider.position(20, baseY + 115);

  cSlider.position(220, baseY + 15);
  dSlider.position(220, baseY + 65);
  supplyShiftSlider.position(220, baseY + 115);

  ceilingCheckbox.position(520, baseY - 5);
  ceilingSlider.position(520, baseY + 20);

  floorCheckbox.position(520, baseY + 60);
  floorSlider.position(520, baseY + 85);

  taxCheckbox.position(720, baseY - 5);
  taxSlider.position(720, baseY + 20);

  subsidyCheckbox.position(720, baseY + 60);
  subsidySlider.position(720, baseY + 85);

  animateCheckbox.position(20, baseY + 155);
  themeButton.position(220, baseY + 150);
  scenarioSelect.position(420, baseY + 150);
  resetButton.position(650, baseY + 150);

  resetDefaults(); // start in a nice baseline
}

function draw() {
  background(darkMode ? 20 : 255);
  tooltipItems = []; // reset tooltip list each frame

  drawAxes();
  drawLegend();
  drawSliderLabels();

  // --- Read base slider values ---
  let a = aSlider.value();
  let b = bSlider.value();
  let c = cSlider.value();
  let d = dSlider.value();
  let dShift = demandShiftSlider.value();
  let sShift = supplyShiftSlider.value();

  // --- Animation: soft oscillating shifts ---
  if (animateCheckbox.checked()) {
    let t = frameCount * 0.02;
    dShift += 1.5 * sin(t);
    sShift += 1.5 * cos(t);
  }

  let aBase = a + dShift;
  let cBase = c + sShift;

  let tax = taxCheckbox.checked() ? taxSlider.value() : 0;
  let subsidy = subsidyCheckbox.checked() ? subsidySlider.value() : 0;

  // Supply with policy (tax/subsidy)
  let cPolicy = cBase + tax - subsidy;

  // Demand, base supply and policy supply
  drawCurves(aBase, b, cBase, d, cPolicy, tax, subsidy);

  // Equilibria
  let eqBase = computeEquilibrium(aBase, b, cBase, d);
  if (eqBase) drawEquilibriumPoint(eqBase, "E₀", color(150));

  let eqPolicy = computeEquilibrium(aBase, b, cPolicy, d);
  if (eqPolicy) drawEquilibriumPoint(eqPolicy, "E", darkMode ? color(255) : color(0));

  // Price controls based on policy equilibrium
  drawPriceControls(aBase, b, cPolicy, d, eqPolicy);

  // Tax/subsidy wedge & area
  drawTaxSubsidyWedge(aBase, b, cBase, cPolicy, d, eqPolicy, tax, subsidy);

  // Info panel
  drawParameterText(a, b, c, d, dShift, sShift, tax, subsidy, eqBase, eqPolicy);

  // Final: tooltip if hovered near key points
  drawTooltip();
}

// ----------------- AXES & LEGEND -----------------

function drawAxes() {
  stroke(darkMode ? 220 : 0);
  strokeWeight(1);

  // axes
  line(margin, margin, margin, height - margin);
  line(margin, height - margin, width - margin, height - margin);

  // labels
  fill(darkMode ? 230 : 0);
  noStroke();
  textSize(16);
  textAlign(CENTER, CENTER);
  text("Quantity (Q)", width / 2, height - margin + 35);

  push();
  translate(margin - 40, height / 2);
  rotate(-HALF_PI);
  text("Price (P)", 0, 0);
  pop();

  // ticks
  textSize(10);
  for (let q = 0; q <= Qmax; q += 5) {
    let v = econToScreen(q, 0);
    stroke(darkMode ? 220 : 0);
    line(v.x, v.y - 4, v.x, v.y + 4);
    noStroke();
    fill(darkMode ? 220 : 0);
    text(q, v.x, v.y + 14);
  }
  for (let p = 0; p <= Pmax; p += 5) {
    let v = econToScreen(0, p);
    stroke(darkMode ? 220 : 0);
    line(v.x - 4, v.y, v.x + 4, v.y);
    noStroke();
    fill(darkMode ? 220 : 0);
    text(p, v.x - 15, v.y);
  }
}

function drawLegend() {
  let x0 = margin + 10;
  let y0 = margin + 10;
  let lineLen = 25;

  textAlign(LEFT, CENTER);
  textSize(12);

  // Demand
  stroke(80, 150, 255);
  strokeWeight(2);
  line(x0, y0, x0 + lineLen, y0);
  noStroke();
  fill(darkMode ? 240 : 0);
  text("Demand", x0 + lineLen + 5, y0);

  // Supply (base)
  y0 += 18;
  stroke(255, 120, 120);
  drawingContext.setLineDash([5, 4]);
  line(x0, y0, x0 + lineLen, y0);
  drawingContext.setLineDash([]);
  noStroke();
  text("Supply (base)", x0 + lineLen + 5, y0);

  // Supply (policy)
  y0 += 18;
  stroke(255, 180, 60);
  line(x0, y0, x0 + lineLen, y0);
  noStroke();
  text("Supply (with tax/subsidy)", x0 + lineLen + 5, y0);

  // Price control & wedge
  y0 += 18;
  stroke(160);
  line(x0, y0, x0 + lineLen, y0);
  noStroke();
  text("Price ceiling / floor", x0 + lineLen + 5, y0);

  y0 += 18;
  stroke(120, 0, 200);
  line(x0, y0, x0 + lineLen, y0);
  noStroke();
  text("Tax / subsidy wedge", x0 + lineLen + 5, y0);
}

function drawSliderLabels() {
  fill(darkMode ? 240 : 0);
  noStroke();
  textSize(12);

  text("Demand intercept (a)", aSlider.x, aSlider.y - 5);
  text("Demand slope (b)", bSlider.x, bSlider.y - 5);
  text("Demand shift", demandShiftSlider.x, demandShiftSlider.y - 5);

  text("Supply intercept (c)", cSlider.x, cSlider.y - 5);
  text("Supply slope (d)", dSlider.x, dSlider.y - 5);
  text("Supply shift", supplyShiftSlider.x, supplyShiftSlider.y - 5);

  if (ceilingCheckbox.checked())
    text("Ceiling price", ceilingSlider.x, ceilingSlider.y - 5);
  if (floorCheckbox.checked())
    text("Floor price", floorSlider.x, floorSlider.y - 5);
  if (taxCheckbox.checked())
    text("Tax per unit", taxSlider.x, taxSlider.y - 5);
  if (subsidyCheckbox.checked())
    text("Subsidy per unit", subsidySlider.x, subsidySlider.y - 5);
}

// --------------- ECON HELPERS -----------------

function econToScreen(Q, P) {
  let x = map(Q, 0, Qmax, margin, width - margin);
  let y = map(P, 0, Pmax, height - margin, margin);
  return createVector(x, y);
}

function demandPrice(Q, aIntercept, b) {
  return aIntercept - b * Q;
}

function supplyPrice(Q, cIntercept, d) {
  return cIntercept + d * Q;
}

function computeEquilibrium(aIntercept, b, cIntercept, d) {
  let denom = b + d;
  if (denom === 0) return null;
  let Qe = (aIntercept - cIntercept) / denom;
  let Pe = demandPrice(Qe, aIntercept, b);
  if (Qe < 0 || Qe > Qmax || Pe < 0 || Pe > Pmax) return null;
  return { Qe, Pe };
}

// --------------- CURVES & EQUILIBRIA -----------------

function drawCurves(aBase, b, cBase, d, cPolicy, tax, subsidy) {
  // Demand
  stroke(80, 150, 255);
  strokeWeight(2);
  let last = null;
  for (let Q = 0; Q <= Qmax; Q += 0.1) {
    let P = demandPrice(Q, aBase, b);
    if (P < 0 || P > Pmax) continue;
    let v = econToScreen(Q, P);
    if (last) line(last.x, last.y, v.x, v.y);
    last = v;
  }

  // Base supply (dashed red)
  stroke(255, 120, 120);
  drawingContext.setLineDash([5, 5]);
  last = null;
  for (let Q = 0; Q <= Qmax; Q += 0.1) {
    let P = supplyPrice(Q, cBase, d);
    if (P < 0 || P > Pmax) continue;
    let v = econToScreen(Q, P);
    if (last) line(last.x, last.y, v.x, v.y);
    last = v;
  }
  drawingContext.setLineDash([]);

  // Policy supply (solid orange) if any tax/subsidy
  if (tax > 0 || subsidy > 0) {
    stroke(255, 180, 60);
    strokeWeight(2);
    last = null;
    for (let Q = 0; Q <= Qmax; Q += 0.1) {
      let P = supplyPrice(Q, cPolicy, d);
      if (P < 0 || P > Pmax) continue;
      let v = econToScreen(Q, P);
      if (last) line(last.x, last.y, v.x, v.y);
      last = v;
    }
  } else {
    // If no tax/subsidy, show base supply as solid red instead
    stroke(255, 80, 80);
    strokeWeight(2);
    last = null;
    for (let Q = 0; Q <= Qmax; Q += 0.1) {
      let P = supplyPrice(Q, cBase, d);
      if (P < 0 || P > Pmax) continue;
      let v = econToScreen(Q, P);
      if (last) line(last.x, last.y, v.x, v.y);
      last = v;
    }
  }
}

function drawEquilibriumPoint(eq, label, col) {
  let v = econToScreen(eq.Qe, eq.Pe);
  fill(col);
  noStroke();
  ellipse(v.x, v.y, 10, 10);
  textSize(12);
  textAlign(LEFT, BOTTOM);
  text(`${label} (${eq.Qe.toFixed(2)}, ${eq.Pe.toFixed(2)})`, v.x + 8, v.y - 4);

  addTooltip(v.x, v.y, `${label}: Q=${eq.Qe.toFixed(2)}, P=${eq.Pe.toFixed(2)}`);
}

// --------------- PRICE CONTROLS (CEILING/FLOOR) -----------------

function drawPriceControls(aBase, b, cPolicy, d, eq) {
  if (!eq) return;

  // Price ceiling
  if (ceilingCheckbox.checked()) {
    let Pc = ceilingSlider.value();
    let v1 = econToScreen(0, Pc);
    let v2 = econToScreen(Qmax, Pc);
    stroke(160);
    strokeWeight(1.5);
    line(v1.x, v1.y, v2.x, v2.y);

    noStroke();
    fill(darkMode ? 240 : 0);
    text(`Ceiling = ${Pc.toFixed(2)}`, v2.x - 120, v2.y - 15);

    let Qd_c = (aBase - Pc) / b;
    let Qs_c = (Pc - cPolicy) / d;

    // Mark Qd & Qs
    if (Qd_c >= 0 && Qd_c <= Qmax) {
      let vd = econToScreen(Qd_c, Pc);
      fill(80, 150, 255);
      ellipse(vd.x, vd.y, 7, 7);
      textAlign(CENTER, TOP);
      text("Qd", vd.x, vd.y + 5);
      addTooltip(vd.x, vd.y, `Qd (at ceiling): ${Qd_c.toFixed(2)}`);
    }
    if (Qs_c >= 0 && Qs_c <= Qmax) {
      let vs = econToScreen(Qs_c, Pc);
      fill(255, 80, 80);
      ellipse(vs.x, vs.y, 7, 7);
      textAlign(CENTER, TOP);
      text("Qs", vs.x, vs.y + 5);
      addTooltip(vs.x, vs.y, `Qs (at ceiling): ${Qs_c.toFixed(2)}`);
    }

    if (Pc < eq.Pe) {
      let shortage = Qd_c - Qs_c;
      fill(darkMode ? 255 : 0);
      textAlign(LEFT, TOP);
      text(
        `Binding ceiling → Shortage ≈ ${shortage.toFixed(2)}`,
        margin + 10,
        margin + 10
      );

      // Shaded shortage band
      let leftQ = max(0, min(Qd_c, Qs_c));
      let rightQ = min(Qmax, max(Qd_c, Qs_c));
      let p1 = econToScreen(leftQ, Pc);
      let p2 = econToScreen(rightQ, Pc);
      let p3 = econToScreen(rightQ, Pc - 0.4);
      let p4 = econToScreen(leftQ, Pc - 0.4);
      noStroke();
      fill(80, 150, 255, 60);
      beginShape();
      vertex(p1.x, p1.y);
      vertex(p2.x, p2.y);
      vertex(p3.x, p3.y);
      vertex(p4.x, p4.y);
      endShape(CLOSE);
    } else {
      fill(darkMode ? 255 : 0);
      textAlign(LEFT, TOP);
      text("Ceiling not binding (Pc ≥ Pe)", margin + 10, margin + 10);
    }
  }

  // Price floor
  if (floorCheckbox.checked()) {
    let Pf = floorSlider.value();
    let v1 = econToScreen(0, Pf);
    let v2 = econToScreen(Qmax, Pf);
    stroke(200, 120, 0);
    strokeWeight(1.5);
    line(v1.x, v1.y, v2.x, v2.y);

    noStroke();
    fill(darkMode ? 255 : 0);
    text(`Floor = ${Pf.toFixed(2)}`, v2.x - 120, v2.y + 3);

    let Qd_f = (aBase - Pf) / b;
    let Qs_f = (Pf - cPolicy) / d;

    if (Qd_f >= 0 && Qd_f <= Qmax) {
      let vd = econToScreen(Qd_f, Pf);
      fill(80, 150, 255);
      ellipse(vd.x, vd.y, 7, 7);
      textAlign(CENTER, TOP);
      text("Qd", vd.x, vd.y + 5);
      addTooltip(vd.x, vd.y, `Qd (at floor): ${Qd_f.toFixed(2)}`);
    }
    if (Qs_f >= 0 && Qs_f <= Qmax) {
      let vs = econToScreen(Qs_f, Pf);
      fill(255, 80, 80);
      ellipse(vs.x, vs.y, 7, 7);
      textAlign(CENTER, TOP);
      text("Qs", vs.x, vs.y + 5);
      addTooltip(vs.x, vs.y, `Qs (at floor): ${Qs_f.toFixed(2)}`);
    }

    if (Pf > eq.Pe) {
      let surplus = Qs_f - Qd_f;
      fill(darkMode ? 255 : 0);
      textAlign(LEFT, TOP);
      text(
        `Binding floor → Surplus ≈ ${surplus.toFixed(2)}`,
        margin + 10,
        margin + 30
      );

      let leftQ = max(0, min(Qd_f, Qs_f));
      let rightQ = min(Qmax, max(Qd_f, Qs_f));
      let p1 = econToScreen(leftQ, Pf);
      let p2 = econToScreen(rightQ, Pf);
      let p3 = econToScreen(rightQ, Pf + 0.4);
      let p4 = econToScreen(leftQ, Pf + 0.4);

      noStroke();
      fill(255, 80, 80, 60);
      beginShape();
      vertex(p1.x, p1.y);
      vertex(p2.x, p2.y);
      vertex(p3.x, p3.y);
      vertex(p4.x, p4.y);
      endShape(CLOSE);
    } else {
      fill(darkMode ? 255 : 0);
      textAlign(LEFT, TOP);
      text("Floor not binding (Pf ≤ Pe)", margin + 10, margin + 30);
    }
  }
}

// --------------- TAX / SUBSIDY WEDGE -----------------

function drawTaxSubsidyWedge(aBase, b, cBase, cPolicy, d, eq, tax, subsidy) {
  if (!eq) return;
  if (tax <= 0 && subsidy <= 0) return;

  let Qe = eq.Qe;

  // Consumers pay Pd on demand curve
  let Pd = demandPrice(Qe, aBase, b);
  // Producers get Pp on BASE supply
  let Pp = supplyPrice(Qe, cBase, d);

  let vPd = econToScreen(Qe, Pd);
  let vPp = econToScreen(Qe, Pp);

  stroke(120, 0, 200);
  strokeWeight(2);
  line(vPd.x, vPd.y, vPp.x, vPp.y);

  // shaded wedge band
  noStroke();
  fill(120, 0, 200, 80);
  let band = 0.3;
  let vPd2 = econToScreen(Qe + band, Pd);
  let vPp2 = econToScreen(Qe + band, Pp);
  beginShape();
  vertex(vPd.x, vPd.y);
  vertex(vPd2.x, vPd2.y);
  vertex(vPp2.x, vPp2.y);
  vertex(vPp.x, vPp.y);
  endShape(CLOSE);

  let label =
    tax > 0 && subsidy <= 0
      ? `Tax wedge ≈ ${tax.toFixed(2)}`
      : subsidy > 0 && tax <= 0
      ? `Subsidy wedge ≈ ${subsidy.toFixed(2)}`
      : `Net wedge ≈ ${(tax - subsidy).toFixed(2)}`;

  fill(darkMode ? 255 : 0);
  noStroke();
  textAlign(LEFT, BOTTOM);
  text(label, vPd.x + 10, (vPd.y + vPp.y) / 2);

  addTooltip(
    (vPd.x + vPp.x) / 2,
    (vPd.y + vPp.y) / 2,
    `${label}\nPd=${Pd.toFixed(2)}, Pp=${Pp.toFixed(2)}`
  );
}

// --------------- INFO PANEL -----------------

function drawParameterText(
  a,
  b,
  c,
  d,
  dShift,
  sShift,
  tax,
  subsidy,
  eqBase,
  eqPolicy
) {
  let x0 = width - 280;
  let y0 = margin;
  fill(darkMode ? 255 : 0);
  textSize(13);
  textAlign(LEFT, TOP);

  text(`Demand: P = (${a.toFixed(1)} + shift_D) - ${b.toFixed(2)}Q`, x0, y0);
  text(
    `Supply: P = (${c.toFixed(1)} + shift_S + tax - subsidy) + ${d.toFixed(
      2
    )}Q`,
    x0,
    y0 + 18
  );
  text(
    `shift_D = ${dShift.toFixed(1)}, shift_S = ${sShift.toFixed(
      1
    )}, tax = ${tax.toFixed(1)}, subsidy = ${subsidy.toFixed(1)}`,
    x0,
    y0 + 38
  );

  if (eqBase) {
    text(
      `Base Eq (no policy): Pe₀ ≈ ${eqBase.Pe.toFixed(
        2
      )}, Qe₀ ≈ ${eqBase.Qe.toFixed(2)}`,
      x0,
      y0 + 60
    );
  }
  if (eqPolicy) {
    text(
      `Policy Eq: Pe ≈ ${eqPolicy.Pe.toFixed(
        2
      )}, Qe ≈ ${eqPolicy.Qe.toFixed(2)}`,
      x0,
      y0 + 78
    );
  }
}

// --------------- TOOLTIP SYSTEM -----------------

function addTooltip(x, y, label) {
  tooltipItems.push({ x, y, label });
}

function drawTooltip() {
  let closest = null;
  let minDist = 18;
  for (let item of tooltipItems) {
    let d = dist(mouseX, mouseY, item.x, item.y);
    if (d < minDist) {
      minDist = d;
      closest = item;
    }
  }
  if (!closest) return;

  textSize(12);
  let lines = closest.label.split("\n");
  let w = 0;
  for (let line of lines) {
    w = max(w, textWidth(line));
  }
  let h = lines.length * 16 + 6;

  let bx = closest.x + 12;
  let by = closest.y - h - 10;
  bx = constrain(bx, margin, width - margin - w - 10);
  by = constrain(by, margin, height - margin - h - 10);

  fill(darkMode ? 40 : 245);
  stroke(darkMode ? 220 : 0);
  rect(bx, by, w + 10, h, 5);

  noStroke();
  fill(darkMode ? 255 : 0);
  let ty = by + 14;
  for (let line of lines) {
    text(line, bx + 5, ty);
    ty += 16;
  }
}

// --------------- SCENARIOS & RESET -----------------

function resetDefaults() {
  aSlider.value(20);
  bSlider.value(1);
  demandShiftSlider.value(0);

  cSlider.value(4);
  dSlider.value(1);
  supplyShiftSlider.value(0);

  ceilingCheckbox.checked(false);
  floorCheckbox.checked(false);
  taxCheckbox.checked(false);
  subsidyCheckbox.checked(false);

  ceilingSlider.value(8);
  floorSlider.value(5);
  taxSlider.value(2);
  subsidySlider.value(2);

  animateCheckbox.checked(false);
  // ❌ REMOVE this line (it was forcing the dropdown back to baseline)
  // scenarioSelect.value("baseline");
}

function applyScenario() {
  const s = scenarioSelect.value();
  resetDefaults();          // reset all sliders/checkboxes first

  if (s === "baseline") {
    // defaults already set
  } else if (s === "demand_boom") {
    demandShiftSlider.value(4);
  } else if (s === "supply_shock") {
    supplyShiftSlider.value(4);
  } else if (s === "ceiling") {
    ceilingCheckbox.checked(true);
    ceilingSlider.value(6);
  } else if (s === "floor") {
    floorCheckbox.checked(true);
    floorSlider.value(10);
  } else if (s === "tax") {
    taxCheckbox.checked(true);
    taxSlider.value(3);
  } else if (s === "subsidy") {
    subsidyCheckbox.checked(true);
    subsidySlider.value(3);
  }
}

