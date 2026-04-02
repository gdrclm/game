(() => {
    const houseVisuals = window.Game.systems.houseVisuals = window.Game.systems.houseVisuals || {};
    const palettes = Object.freeze([
        Object.freeze({
            roofMain: '#d7a52f',
            roofAlt: '#bf7d18',
            roofHighlight: '#f1c85a',
            roofFringe: '#a86110',
            roofStroke: '#7b4e09',
            wallLeft: '#e6d2b1',
            wallRight: '#c7a780',
            wallStroke: '#6a4524',
            floor: '#8a6633',
            floorStroke: '#5f431f',
            shadow: 'rgba(0, 0, 0, 0.16)',
            door: '#6a4321',
            doorStroke: '#3b220d',
            window: '#ffd96b',
            windowStroke: '#6b4726',
            interiorFloor: '#eef4d7',
            interiorFloorAlt: '#dbe8be',
            interiorBorder: '#47362a',
            interiorWallNorth: '#c7d39a',
            interiorWallWest: '#afbc82',
            interiorWallStroke: '#6f7650'
        }),
        Object.freeze({
            roofMain: '#ca9427',
            roofAlt: '#a96b14',
            roofHighlight: '#edc257',
            roofFringe: '#92540e',
            roofStroke: '#724608',
            wallLeft: '#dfc7a3',
            wallRight: '#bc9b71',
            wallStroke: '#5d3d20',
            floor: '#825c2f',
            floorStroke: '#543916',
            shadow: 'rgba(0, 0, 0, 0.16)',
            door: '#5d3a1c',
            doorStroke: '#321c09',
            window: '#ffe090',
            windowStroke: '#5d3d20',
            interiorFloor: '#edf1d2',
            interiorFloorAlt: '#d4dfb1',
            interiorBorder: '#413126',
            interiorWallNorth: '#c0ca93',
            interiorWallWest: '#a3af7c',
            interiorWallStroke: '#66704a'
        }),
        Object.freeze({
            roofMain: '#e0b13a',
            roofAlt: '#c4881f',
            roofHighlight: '#f6d06d',
            roofFringe: '#aa6415',
            roofStroke: '#875712',
            wallLeft: '#ead8ba',
            wallRight: '#cfaf86',
            wallStroke: '#744d29',
            floor: '#92703c',
            floorStroke: '#604421',
            shadow: 'rgba(0, 0, 0, 0.16)',
            door: '#734724',
            doorStroke: '#43250f',
            window: '#ffd45c',
            windowStroke: '#734d2a',
            interiorFloor: '#f0f5db',
            interiorFloorAlt: '#dce7bd',
            interiorBorder: '#4b382b',
            interiorWallNorth: '#cad6a1',
            interiorWallWest: '#b5c28b',
            interiorWallStroke: '#717850'
        })
    ]);

    houseVisuals.housePalettes = palettes;
    houseVisuals.getPalette = (paletteIndex) => palettes[((paletteIndex % palettes.length) + palettes.length) % palettes.length];
})();
