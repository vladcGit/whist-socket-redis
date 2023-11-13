import { hexToRgb } from "./util";

const colors = [
  hexToRgb("117DAA"),
  hexToRgb("FF2362"),
  hexToRgb("2C2C54"),
  hexToRgb("ACC3A6"),
  hexToRgb("839073"),
];

let step = 0;
//color table indices for:
// current color left
// next color left
// current color right
// next color right
const colorIndices = [0, 1, 2, 3];

//transition speed
const gradientSpeed = 0.002;

export default function updateGradient() {
  const c0_0 = colors[colorIndices[0]];
  const c0_1 = colors[colorIndices[1]];
  const c1_0 = colors[colorIndices[2]];
  const c1_1 = colors[colorIndices[3]];

  const istep = 1 - step;
  const r1 = Math.round(istep * c0_0[0] + step * c0_1[0]);
  const g1 = Math.round(istep * c0_0[1] + step * c0_1[1]);
  const b1 = Math.round(istep * c0_0[2] + step * c0_1[2]);
  const color1 = `rgb(${r1}, ${g1}, ${b1})`;

  const r2 = Math.round(istep * c1_0[0] + step * c1_1[0]);
  const g2 = Math.round(istep * c1_0[1] + step * c1_1[1]);
  const b2 = Math.round(istep * c1_0[2] + step * c1_1[2]);
  const color2 = `rgb(${r2}, ${g2}, ${b2})`;

  const gradient = document.getElementById("gradient");
  if (!gradient) return;
  gradient.style.position = "absolute";
  gradient.style.height = "100vh";
  gradient.style.width = "100vw";
  gradient.style.background = `-webkit-gradient(linear, left top, right top, from(${color1}), to(${color2}))`;

  gradient.style.background = `-moz-linear-gradient(left, ${color1} 0%, ${color2} 100%)`;

  step += gradientSpeed;
  if (step >= 1) {
    step %= 1;
    colorIndices[0] = colorIndices[1];
    colorIndices[2] = colorIndices[3];

    //pick two new target color indices
    //do not pick the same as the current one
    colorIndices[1] =
      (colorIndices[1] + Math.floor(1 + Math.random() * (colors.length - 1))) %
      colors.length;
    colorIndices[3] =
      (colorIndices[3] + Math.floor(1 + Math.random() * (colors.length - 1))) %
      colors.length;
  }
}
