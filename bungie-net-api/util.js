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