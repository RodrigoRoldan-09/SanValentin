import * as THREE from 'three';

// Ecuación implícita: (x^2 + (9/4)y^2 + z^2 - 1)^3 - x^2z^3 - (9/200)y^2z^3 = 0
// Sin embargo, para dibujar puntos es más fácil usar una parametrización o generar puntos aleatorios y filtrar.
// Una parametrización común para el corazón 3D es:
// x = 16 * sin(t)^3
// y = 13 * cos(t) - 5 * cos(2*t) - 2 * cos(3*t) - cos(4*t)
// z... pero esa es 2D extruida o rotada.
//
// Vamos a usar la técnica de Monte Carlo (puntos aleatorios) filtrados por la inecuación <= 0.
// O mejor, generar puntos en coordenadas esféricas y ajustar el radio para encontrar la superficie.
//
// Para la animación "construcción", podemos ordenar los puntos por coordenada Y (de abajo hacia arriba).

export function generateHeartPoints(numPoints = 10000) {
    const points = [];
    const geometry = new THREE.BufferGeometry();
    
    // Bounding box aproximado
    const range = 1.5; 
    const step = 0.05; // Ajustar para densidad

    // Método de escaneo grid para puntos más uniformes que random
    // Sin embargo, random se ve más orgánico al aparecer.
    // Probemos random rejection sampling para obtener puntos DENTRO o EN LA SUPERFICIE.
    // Queremos la SUPERFICIE.
    // La ecuación implícita f(x,y,z) = 0 define la superficie.
    // Podemos iterar sobre x, z y encontrar y, o usar coordenadas esféricas.
    
    // Usaremos un enfoque híbrido: coordenadas esféricas perturbadas para encontrar raíces.
    // O simplemente fuerza bruta inteligente: Random points en cubo, si abs(f(x,y,z)) < epsilon -> guardar punto.
    
    let iterations = 0;
    while (points.length < numPoints && iterations < numPoints * 100) {
        const x = (Math.random() - 0.5) * 3;
        const y = (Math.random() - 0.5) * 3;
        const z = (Math.random() - 0.5) * 3;
        
        // Ecuación: (x^2 + 9/4 y^2 + z^2 - 1)^3 - x^2 z^3 - 9/200 y^2 z^3 = 0
        // Nota: en la imagen del usuario, 'z' parece ser el eje vertical (altura), pero en Three.js es Y.
        // Vamos a mapear la ecuación:
        // Ecuación original (math): Z es arriba. Three.js: Y es arriba.
        // Intercambiamos y <-> z en la fórmula.
        // Formula original: (x^2 + 9/4 y^2 + z^2 - 1)^3 - x^2 z^3 - 9/200 y^2 z^3 = 0
        // Con Y como up:   (x^2 + 9/4 z^2 + y^2 - 1)^3 - x^2 y^3 - 9/200 z^2 y^3 = 0
        
        // Probamos un punto. Si está cerca de 0, es superficie.
        const val = evaluateHeartEquation(x, y, z);
        
        if (Math.abs(val) < 0.1) { // Umbral ajustado
             points.push(new THREE.Vector3(x, y, z));
        }
        iterations++;
    }

    return points;
}

// Función para encontrar puntos en la superficie de manera más determinista
export function generateHeartSurfacePoints(numPoints) {
    const points = [];
    // Usamos coordenadas esféricas modificadas
    // x = r * sin(theta) * cos(phi)
    // z = r * sin(theta) * sin(phi)
    // y = r * cos(theta)
    
    // Pero la ecuación es compleja para resolver r.
    // Vamos a usar un método de "ray marching" desde el centro (0,0,0) hacia afuera.
    // Para cada dirección (theta, phi), buscamos el r tal que f(r) = 0.
    
    const steps = Math.sqrt(numPoints); // pasos para theta y phi
    
    for (let theta = 0; theta < Math.PI; theta += Math.PI / steps) {
        for (let phi = 0; phi < 2 * Math.PI; phi += 2 * Math.PI / steps) {
            // Dirección
            const dx = Math.sin(theta) * Math.cos(phi);
            const dz = Math.sin(theta) * Math.sin(phi); // Z en horizontal
            const dy = Math.cos(theta);                 // Y es vertical (Three.js)

            // Ray casting: incrementar r hasta cruzar 0
            // Sabemos que el corazón está contenido en r < 3
            // La función f(0,0,0) = -1. f(lejos) > 0.
            // Bisección para encontrar raíz.
            
            let rPoints = findRoots(dx, dy, dz);
            rPoints.forEach(r => {
                 points.push(new THREE.Vector3(dx*r, dy*r, dz*r));
            });
        }
    }
    return points;
}

function evaluateHeartEquation(x, y, z) {
    // Ajuste de escala: x, y, z son coordenadas.
    // ThreeJS Y es UP.
    // Ecuación standard asume Z es UP usualmente en mates, pero revisemos la imagen.
    // Imagen 2: eje vertical parece Z.
    // Ecuación: (x^2 + 9/4 y^2 + z^2 - 1)^3 - x^2 z^3 - 9/200 y^2 z^3 = 0
    // Si Z s vertical en la fórmula, entonces en Three.js (donde Y es vertical) hacemos:
    // x_form = x_three
    // y_form = z_three
    // z_form = y_three
    
    const x2 = x*x;
    const y_form = z; 
    const z_form = y; // Y de threejs es Z de la fórmula
    
    const y2 = y_form*y_form;
    const z2 = z_form*z_form;
    const z3 = z_form*z2; // z^3
    
    const term1 = x2 + (9/4)*y2 + z2 - 1;
    const term2 = term1 * term1 * term1;
    const term3 = x2 * z3;
    const term4 = (9/200) * y2 * z3;
    
    return term2 - term3 - term4;
}

function findRoots(dx, dy, dz) {
    // Buscamos r tal que f(r*dx, r*dy, r*dz) = 0
    // r entre 0 y 2 es suficiente.
    let start = 0;
    let end = 5;
    let roots = [];
    
    // Muestreo grueso para encontrar cambio de signo
    let step = 0.05;
    let prevVal = evaluateHeartEquation(start*dx, start*dy, start*dz);
    
    for (let r = start + step; r < end; r += step) {
        let val = evaluateHeartEquation(r*dx, r*dy, r*dz);
        if (prevVal * val < 0) {
            // Cambio de signo: raíz entre r-step y r
            // Refinar con bisección
            let rA = r - step;
            let rB = r;
            for(let k=0; k<10; k++) {
                let mid = (rA+rB)/2;
                let vMid = evaluateHeartEquation(mid*dx, mid*dy, mid*dz);
                if (vMid * prevVal < 0) {
                    rB = mid;
                    val = vMid;
                } else {
                    rA = mid;
                    prevVal = vMid;
                }
            }
            roots.push((rA+rB)/2);
            // Salimos tras encontrar la superficie principal (el corazón es hueco/superficie cerrada única mayormente)
            // break; // Si queremos solo la primera capa
        }
        prevVal = val;
    }
    return roots;
}
