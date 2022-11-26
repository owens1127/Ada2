/**
 * Returns a color for each energy type
 * @param {number} energyType
 * @return {string}
 */
exports.colorFromEnergy = (energyType) => {
    switch(energyType) {
        case 1: // arc
            return '#85e4ff'
        case 2: // solar
            return '#ff8000'
        case 3: // void
            return '#a11fed'
        case 6: // stasis
            return '#6a91e6'
        case 4: // Ghost
            return '#d1d1d1'
        default: return '#ffffff'
    }

}

/**
 * Returns a path to the elemental overlay for a hash
 * @param {number} statTypeHash 
 * @returns 
 */
exports.modEnergyType = (statTypeHash) => {
    switch(statTypeHash) {
        // DestinyStatDefinition comes from the DestinyInventoryItemDefinition.investmentStats array
        case 2399985800: // void
            return '/res/void_overlay.png';
        case 3344745325: // solar
            return '/res/solar_overlay.png';
        case 3779394102: // arc
            return '/res/arc_overlay.png';
        case 998798867: // stasis
            return '/res/stasis_overlay.png';
        default: return null; // no element
    }
}

/**
 * Cost of a mod from it's investmentStats
 * @param { DestinyItemInvestmentStatDefinition[]} investmentStats
 */
exports.costs = (investmentStats) => {
    const arr = [];
    investmentStats.forEach(stat => {
        const hash = stat.statTypeHash;
        if (hash === 2399985800) arr.push(`${stat.value} Void Energy`);
        else if (hash === 3779394102) arr.push(`${stat.value} Arc Energy`);
        else if (hash === 3344745325) arr.push(`${stat.value} Solar Energy`);
        else if (hash === 998798867) arr.push(`${stat.value} Stasis Energy`);
        else if (hash === 3578062600) arr.push(`${stat.value} Energy`);
    });
    return arr;
}

/**
 * Stat adjustments of a mod from it's investmentStats
 * @param { DestinyItemInvestmentStatDefinition[]} investmentStats
 */
exports.adjustments = (investmentStats) => {
    const arr = [];
    investmentStats.forEach(stat => {
        const hash = stat.statTypeHash;
        const c = stat.isConditionallyActive;
        if (hash === 2996146975) arr.push(`${stat.value} Mobility${c ? '*' : ''}`);
        else if (hash === 392767087) arr.push(`${stat.value} Resilience${c ? '*' : ''}`);
        else if (hash === 1943323491) arr.push(`${stat.value} Recovery${c ? '*' : ''}`);
        else if (hash === 1735777505) arr.push(`${stat.value} Discipline${c ? '*' : ''}`);
        else if (hash === 144602215) arr.push(`${stat.value} Intellect${c ? '*' : ''}`);
        else if (hash === 4244567218) arr.push(`${stat.value} Strength${c ? '*' : ''}`);
    });
    return arr;
}