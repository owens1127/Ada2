/**
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
        default: return null;
    }
}