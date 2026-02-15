// Standalone test script, no imports
function evaluateHeartEquation(x, y, z) {
    // Ecuación standard asume Z es UP usualmente en mates, pero revisemos la imagen.
    // Imagen 2: eje vertical parece Z.
    // Ecuación: (x^2 + 9/4 y^2 + z^2 - 1)^3 - x^2 z^3 - 9/200 y^2 z^3 = 0
    // Si Z s vertical en la fórmula, entonces en Three.js (donde Y es vertical) hacemos:
    // x_form = x_three
    // y_form = z_three
    // z_form = y_three

    // x, y, z here are ThreeJS coordinates (x, y=UP, z=DEPTH)
    const x2 = x * x;
    const y_form = z;
    const z_form = y; // Y de threejs es Z de la fórmula

    const y2 = y_form * y_form;
    const z2 = z_form * z_form;
    const z3 = z_form * z2; // z^3

    const term1 = x2 + (9 / 4) * y2 + z2 - 1;
    const term2 = term1 * term1 * term1;
    const term3 = x2 * z3;
    const term4 = (9 / 200) * y2 * z3;

    return term2 - term3 - term4;
}

function findRoots(dx, dy, dz) {
    let start = 0;
    let end = 5;
    let roots = [];

    let step = 0.05;
    let prevVal = evaluateHeartEquation(start * dx, start * dy, start * dz);

    for (let r = start + step; r < end; r += step) {
        let val = evaluateHeartEquation(r * dx, r * dy, r * dz);
        if (prevVal * val < 0) {
            let rA = r - step;
            let rB = r;
            for (let k = 0; k < 10; k++) {
                let mid = (rA + rB) / 2;
                let vMid = evaluateHeartEquation(mid * dx, mid * dy, mid * dz);
                if (vMid * prevVal < 0) {
                    rB = mid;
                    val = vMid;
                } else {
                    rA = mid;
                    prevVal = vMid;
                }
            }
            roots.push((rA + rB) / 2);
        }
        prevVal = val;
    }
    return roots;
}

function generateHeartSurfacePoints(numPoints) {
    const points = [];
    const steps = Math.sqrt(numPoints);

    console.log(`Scanning with ${Math.floor(steps)} steps...`);

    for (let theta = 0; theta < Math.PI; theta += Math.PI / steps) {
        for (let phi = 0; phi < 2 * Math.PI; phi += 2 * Math.PI / steps) {
            const dx = Math.sin(theta) * Math.cos(phi);
            const dz = Math.sin(theta) * Math.sin(phi); // Z en horizontal
            const dy = Math.cos(theta);                 // Y es vertical (Three.js)

            let rPoints = findRoots(dx, dy, dz);
            rPoints.forEach(r => {
                points.push({ x: dx * r, y: dy * r, z: dz * r });
            });
        }
    }
    return points;
}

const points = generateHeartSurfacePoints(1000);
console.log(`Generated ${points.length} points.`);
if (points.length > 0) {
    console.log("Sample Point:", points[Math.floor(points.length / 2)]);
}
