// Supply & Demand Simulation with Price Ceiling & Floor
// Axes: Q on x-axis, P on y-axis

let aSlider, bSlider, cSlider, dSlider;
let demandShiftSlider, supplyShiftSlider;

let ceilingCheckbox, ceilingSlider;
let floorCheckbox, floorSlider;

let Qmax = 20;
let Pmax = 20;
let margin = 70;

let lastEquilibrium = null; // store last valid equilibrium for text display

function setup() {
  createCanvas(900, 520);

  textFont('sans-serif');

  // Demand: P = (a + demandShift) - b Q
  aSlider = createSlider(10, 30, 20, 1);
  bSlider = createSlider(0.5, 3, 1, 0.1);
  demandShiftSlider = createSlider(-5, 5, 0, 0.5);

  // Supply: P = (c + supplyShift) + d Q
  cSlider = createSlider(0, 15, 4, 1);
  dSlider = createSlider(0.5, 3, 1, 0.1);
  supplyShiftSlider = createSlider(-5, 5, 0, 0.5);

  // price ceiling
  ceilingCheckbox = createCheckbox('Enable price ceiling', false);
  ceilingSlider = createSlider(0, Pmax, 8, 0.5);

  // price floor
  floorCheckbox = createCheckbox('Enable price floor', false);
  floorSlider = createSlider(0, Pmax, 5, 0.5);

  // Position UI elements (below the canvas)
  let baseY = height + 20;

  aSlider.position(20, baseY);
  bSlider.position(20, baseY + 30);
  demandShiftSlider.position(20, baseY + 60);

  cSlider.position(260, baseY);
  dSlider.position(260, baseY + 30);
  supplyShiftSlider.position(260, baseY + 60);

  ceilingCheckbox.position(520, baseY - 5);
  ceilingSlider.position(520, baseY + 20);

  floorCheckbox.position(520, baseY + 60);
  floorSlider.position(520, baseY + 85);
}

function draw() {
  background(255);

  drawAxes();

  // Get parameter values
  let a = aSlider.value();
  let b = bSlider.value();
  let c = cSlider.value();
  let d = dSlider.value();
  let dShift = demandShiftSlider.value();
  let sShift = supplyShiftSlider.value();

  // Derived intercepts after shifts
  let aPrime = a + dShift;
  let cPrime = c + sShift;

  drawCurves(aPrime, b, cPrime, d);
  let eq = drawEquilibrium(aPrime, b, cPrime, d);
  drawPolicyLines(aPrime, b, cPrime, d, eq);
  drawParameterText(a, b, c, d, dShift, sShift, eq);
}

// ---------- Maths helpers ----------

function demandPrice(Q, aPrime, b) {
  return aPrime - b * Q;
}

function supplyPrice(Q, cPrime, d) {
  return cPrime + d * Q;
}

// Convert economic (Q, P) to screen coordinates
function econToScreen(Q, P) {
  let x = map(Q, 0, Qmax, margin, width - margin);
  let y = map(P, 0, Pmax, height - margin, margin);
  return createVector(x, y);
}

// ---------- Drawing functions ----------

function drawAxes() {
  stroke(0);
  strokeWeight(1);
  // y-axis (Price)
  line(margin, margin, margin, height - margin);
  // x-axis (Quantity)
  line(margin, height - margin, width - margin, height - margin);

  // Axis labels
  noStroke();
  fill(0);
  textSize(16);
  textAlign(CENTER, CENTER);
  text('Quantity (Q)', width / 2, height - margin + 35);

  push();
  translate(margin - 40, height / 2);
  rotate(-HALF_PI);
  text('Price (P)', 0, 0);
  pop();

  // simple ticks
  textSize(10);
  for (let q = 0; q <= Qmax; q += 5) {
    let v = econToScreen(q, 0);
    stroke(0);
    line(v.x, v.y - 4, v.x, v.y + 4);
    noStroke();
    text(q, v.x, v.y + 14);
  }
  for (let p = 0; p <= Pmax; p += 5) {
    let v = econToScreen(0, p);
    stroke(0);
    line(v.x - 4, v.y, v.x + 4, v.y);
    noStroke();
    text(p, v.x - 15, v.y);
  }
}

function drawCurves(aPrime, b, cPrime, d) {
  // Demand in blue
  stroke(0, 0, 255);
  strokeWeight(2);
  let last = null;
  for (let Q = 0; Q <= Qmax; Q += 0.1) {
    let P = demandPrice(Q, aPrime, b);
    if (P < 0 || P > Pmax) continue;
    let v = econToScreen(Q, P);
    if (last) line(last.x, last.y, v.x, v.y);
    last = v;
  }

  // Supply in red
  stroke(255, 0, 0);
  last = null;
  for (let Q = 0; Q <= Qmax; Q += 0.1) {
    let P = supplyPrice(Q, cPrime, d);
    if (P < 0 || P > Pmax) continue;
    let v = econToScreen(Q, P);
    if (last) line(last.x, last.y, v.x, v.y);
    last = v;
  }
}

function drawEquilibrium(aPrime, b, cPrime, d) {
  let denom = b + d;
  if (denom === 0) return null;

  let Qe = (aPrime - cPrime) / denom;
  let Pe = demandPrice(Qe, aPrime, b);

  if (Qe < 0 || Qe > Qmax || Pe < 0 || Pe > Pmax) return null;

  let v = econToScreen(Qe, Pe);

  fill(0);
  noStroke();
  ellipse(v.x, v.y, 10, 10);
  textAlign(LEFT, BOTTOM);
  textSize(12);
  text(`E (${Qe.toFixed(2)}, ${Pe.toFixed(2)})`, v.x + 8, v.y - 4);

  lastEquilibrium = { Qe, Pe };
  return lastEquilibrium;
}

function drawPolicyLines(aPrime, b, cPrime, d, eq) {
  textSize(12);
  textAlign(LEFT, TOP);

  // ----- Price Ceiling -----
  if (ceilingCheckbox.checked()) {
    let Pc = ceilingSlider.value();

    // line
    let v1 = econToScreen(0, Pc);
    let v2 = econToScreen(Qmax, Pc);
    stroke(100);
    strokeWeight(1.5);
    line(v1.x, v1.y, v2.x, v2.y);
    noStroke();
    fill(50);
    text(`Ceiling = ${Pc.toFixed(2)}`, v2.x - 120, v2.y - 15);

    // quantities at this price
    let Qd_c = (aPrime - Pc) / b;
    let Qs_c = (Pc - cPrime) / d;

    // show intersections if within range
    if (Qd_c >= 0 && Qd_c <= Qmax) {
      let vd = econToScreen(Qd_c, Pc);
      fill(0, 0, 255);
      ellipse(vd.x, vd.y, 7, 7);
      textAlign(CENTER, TOP);
      text('Qd', vd.x, vd.y + 5);
    }
    if (Qs_c >= 0 && Qs_c <= Qmax) {
      let vs = econToScreen(Qs_c, Pc);
      fill(255, 0, 0);
      ellipse(vs.x, vs.y, 7, 7);
      textAlign(CENTER, TOP);
      text('Qs', vs.x, vs.y + 5);
    }

    // shortage if binding (Pc < Pe)
    if (eq && Pc < eq.Pe) {
      let shortage = Qd_c - Qs_c;
      fill(0, 0, 0);
      textAlign(LEFT, TOP);
      text(
        `Binding ceiling → Shortage ≈ ${shortage.toFixed(2)}`,
        margin + 10,
        margin + 10
      );

      // simple shaded region between Qs and Qd at Pc
      let leftQ = max(0, min(Qd_c, Qs_c));
      let rightQ = min(Qmax, max(Qd_c, Qs_c));
      let r1 = econToScreen(leftQ, Pc + 0.1);
      let r2 = econToScreen(rightQ, Pc - 0.1);

      noStroke();
      fill(0, 0, 255, 40);
      rectMode(CORNERS);
      rect(r1.x, r1.y, r2.x, r2.y);
    } else {
      fill(0);
      textAlign(LEFT, TOP);
      text('Ceiling not binding (Pc ≥ Pe)', margin + 10, margin + 10);
    }
  }

  // ----- Price Floor -----
  if (floorCheckbox.checked()) {
    let Pf = floorSlider.value();

    let v1 = econToScreen(0, Pf);
    let v2 = econToScreen(Qmax, Pf);
    stroke(120, 60, 0);
    strokeWeight(1.5);
    line(v1.x, v1.y, v2.x, v2.y);
    noStroke();
    fill(120, 60, 0);
    textAlign(LEFT, BOTTOM);
    text(`Floor = ${Pf.toFixed(2)}`, v2.x - 120, v2.y + 3);

    let Qd_f = (aPrime - Pf) / b;
    let Qs_f = (Pf - cPrime) / d;

    if (Qd_f >= 0 && Qd_f <= Qmax) {
      let vd = econToScreen(Qd_f, Pf);
      fill(0, 0, 255);
      ellipse(vd.x, vd.y, 7, 7);
      textAlign(CENTER, TOP);
      text('Qd', vd.x, vd.y + 5);
    }
    if (Qs_f >= 0 && Qs_f <= Qmax) {
      let vs = econToScreen(Qs_f, Pf);
      fill(255, 0, 0);
      ellipse(vs.x, vs.y, 7, 7);
      textAlign(CENTER, TOP);
      text('Qs', vs.x, vs.y + 5);
    }

    if (eq && Pf > eq.Pe) {
      let surplus = Qs_f - Qd_f;
      fill(0);
      textAlign(LEFT, TOP);
      text(
        `Binding floor → Surplus ≈ ${surplus.toFixed(2)}`,
        margin + 10,
        margin + 30
      );

      // shaded surplus region
      let leftQ = max(0, min(Qd_f, Qs_f));
      let rightQ = min(Qmax, max(Qd_f, Qs_f));
      let r1 = econToScreen(leftQ, Pf + 0.1);
      let r2 = econToScreen(rightQ, Pf - 0.1);

      noStroke();
      fill(255, 0, 0, 40);
      rectMode(CORNERS);
      rect(r1.x, r1.y, r2.x, r2.y);
    } else {
      fill(0);
      textAlign(LEFT, TOP);
      text('Floor not binding (Pf ≤ Pe)', margin + 10, margin + 30);
    }
  }
}

function drawParameterText(a, b, c, d, dShift, sShift, eq) {
  fill(0);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(13);

  let x0 = width - 280;
  let y0 = margin;

  text('Demand: P = (a + shiftD) - bQ', x0, y0);
  text(`a = ${a.toFixed(1)},  b = ${b.toFixed(2)},  shiftD = ${dShift.toFixed(1)}`, x0, y0 + 18);

  text('Supply: P = (c + shiftS) + dQ', x0, y0 + 40);
  text(`c = ${c.toFixed(1)},  d = ${d.toFixed(2)},  shiftS = ${sShift.toFixed(1)}`, x0, y0 + 58);

  y0 += 85;
  if (eq) {
    text(
      `Equilibrium: Pe ≈ ${eq.Pe.toFixed(2)},  Qe ≈ ${eq.Qe.toFixed(2)}`,
      x0,
      y0
    );
  } else {
    text('Equilibrium is outside the graph window.', x0, y0);
  }
}
