/**
 * Local SVG Avatar Generator
 * Generates unique, colorful avatars without external API calls
 */

function generateLocalAvatar(seed) {
    // Use seed to generate consistent but unique colors/patterns
    const hash = simpleHash(seed);

    const hue1 = hash % 360;
    const hue2 = (hash * 7) % 360;
    const hue3 = (hash * 13) % 360;

    const color1 = `hsl(${hue1}, 70%, 60%)`;
    const color2 = `hsl(${hue2}, 70%, 50%)`;
    const color3 = `hsl(${hue3}, 70%, 70%)`;

    const pattern = (hash % 5); // 5 different patterns

    let svgContent = '';

    switch(pattern) {
        case 0: // Circles
            svgContent = `
                <circle cx="50" cy="50" r="40" fill="${color1}"/>
                <circle cx="50" cy="50" r="25" fill="${color2}"/>
                <circle cx="50" cy="50" r="12" fill="${color3}"/>
            `;
            break;
        case 1: // Triangles
            svgContent = `
                <polygon points="50,10 90,90 10,90" fill="${color1}"/>
                <polygon points="50,30 75,75 25,75" fill="${color2}"/>
                <circle cx="50" cy="60" r="8" fill="${color3}"/>
            `;
            break;
        case 2: // Squares
            svgContent = `
                <rect x="10" y="10" width="80" height="80" fill="${color1}" rx="5"/>
                <rect x="25" y="25" width="50" height="50" fill="${color2}" rx="3"/>
                <rect x="40" y="40" width="20" height="20" fill="${color3}" rx="2"/>
            `;
            break;
        case 3: // Diamonds
            svgContent = `
                <polygon points="50,5 95,50 50,95 5,50" fill="${color1}"/>
                <polygon points="50,20 80,50 50,80 20,50" fill="${color2}"/>
                <circle cx="50" cy="50" r="10" fill="${color3}"/>
            `;
            break;
        case 4: // Mixed
            svgContent = `
                <rect x="0" y="0" width="100" height="100" fill="${color1}"/>
                <circle cx="50" cy="50" r="35" fill="${color2}"/>
                <polygon points="50,25 65,60 35,60" fill="${color3}"/>
            `;
            break;
    }

    const svg = `
        <svg width="200" height="200" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            ${svgContent}
        </svg>
    `;

    return svg;
}

function generateAvatarDataURL(seed) {
    const svg = generateLocalAvatar(seed);
    const base64 = btoa(svg);
    return `data:image/svg+xml;base64,${base64}`;
}

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateLocalAvatar, generateAvatarDataURL };
}
