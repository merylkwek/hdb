import { FlatTransaction, SingaporeRegion, TownSummary, FlatType } from '../types/housing';

export const SINGAPORE_TOWNS: Record<string, {
  region: SingaporeRegion;
  lat: number;
  lng: number;
  svy21_e: number;
  svy21_n: number;
  avgBasePsm: number;
  mapX: number; // percentage in SVG viewBox (0-100)
  mapY: number; // percentage in SVG viewBox (0-100)
}> = {
  'ANG MO KIO': { region: 'North-East', lat: 1.3691, lng: 103.8454, svy21_e: 29812, svy21_n: 39120, avgBasePsm: 5850, mapX: 52, mapY: 41 },
  'BEDOK': { region: 'East', lat: 1.3236, lng: 103.9273, svy21_e: 38920, svy21_n: 34100, avgBasePsm: 5400, mapX: 74, mapY: 57 },
  'BISHAN': { region: 'Central', lat: 1.3526, lng: 103.8352, svy21_e: 28680, svy21_n: 37300, avgBasePsm: 7800, mapX: 49, mapY: 47 },
  'BUKIT BATOK': { region: 'West', lat: 1.3590, lng: 103.7496, svy21_e: 19160, svy21_n: 38010, avgBasePsm: 5350, mapX: 28, mapY: 45 },
  'BUKIT MERAH': { region: 'Central', lat: 1.2819, lng: 103.8239, svy21_e: 27420, svy21_n: 29480, avgBasePsm: 8300, mapX: 46, mapY: 72 },
  'BUKIT PANJANG': { region: 'West', lat: 1.3774, lng: 103.7719, svy21_e: 21640, svy21_n: 40050, avgBasePsm: 5200, mapX: 33, mapY: 38 },
  'CHOA CHU KANG': { region: 'West', lat: 1.3840, lng: 103.7470, svy21_e: 18870, svy21_n: 40780, avgBasePsm: 5100, mapX: 27, mapY: 36 },
  'CLEMENTI': { region: 'West', lat: 1.3162, lng: 103.7649, svy21_e: 20860, svy21_n: 33280, avgBasePsm: 6900, mapX: 31, mapY: 59 },
  'GEYLANG': { region: 'Central', lat: 1.3201, lng: 103.8918, svy21_e: 34970, svy21_n: 33710, avgBasePsm: 6600, mapX: 63, mapY: 58 },
  'HOUGANG': { region: 'North-East', lat: 1.3712, lng: 103.8926, svy21_e: 35060, svy21_n: 39360, avgBasePsm: 5650, mapX: 64, mapY: 40 },
  'JURONG EAST': { region: 'West', lat: 1.3329, lng: 103.7436, svy21_e: 18490, svy21_n: 35120, avgBasePsm: 5500, mapX: 26, mapY: 54 },
  'JURONG WEST': { region: 'West', lat: 1.3404, lng: 103.7090, svy21_e: 14640, svy21_n: 35950, avgBasePsm: 5050, mapX: 17, mapY: 52 },
  'KALLANG/WHAMPOA': { region: 'Central', lat: 1.3100, lng: 103.8651, svy21_e: 32000, svy21_n: 32600, avgBasePsm: 7400, mapX: 56, mapY: 62 },
  'PASIR RIS': { region: 'East', lat: 1.3721, lng: 103.9474, svy21_e: 41160, svy21_n: 39470, avgBasePsm: 5300, mapX: 80, mapY: 40 },
  'PUNGGOL': { region: 'North-East', lat: 1.4052, lng: 103.9023, svy21_e: 36140, svy21_n: 43130, avgBasePsm: 6200, mapX: 66, mapY: 28 },
  'QUEENSTOWN': { region: 'Central', lat: 1.2942, lng: 103.8060, svy21_e: 25430, svy21_n: 30840, avgBasePsm: 8900, mapX: 41, mapY: 67 },
  'SEMBAWANG': { region: 'North', lat: 1.4491, lng: 103.8185, svy21_e: 26820, svy21_n: 47980, avgBasePsm: 4950, mapX: 44, mapY: 14 },
  'SENGKANG': { region: 'North-East', lat: 1.3868, lng: 103.8914, svy21_e: 34930, svy21_n: 41090, avgBasePsm: 5800, mapX: 63, mapY: 34 },
  'SERANGOON': { region: 'North-East', lat: 1.3554, lng: 103.8679, svy21_e: 32320, svy21_n: 37620, avgBasePsm: 6700, mapX: 57, mapY: 46 },
  'TAMPINES': { region: 'East', lat: 1.3496, lng: 103.9441, svy21_e: 40790, svy21_n: 36980, avgBasePsm: 5700, mapX: 78, mapY: 48 },
  'TOA PAYOH': { region: 'Central', lat: 1.3343, lng: 103.8563, svy21_e: 31020, svy21_n: 35280, avgBasePsm: 7500, mapX: 54, mapY: 53 },
  'WOODLANDS': { region: 'North', lat: 1.4382, lng: 103.7890, svy21_e: 23540, svy21_n: 46780, avgBasePsm: 4850, mapX: 37, mapY: 17 },
  'YISHUN': { region: 'North', lat: 1.4304, lng: 103.8354, svy21_e: 28700, svy21_n: 45910, avgBasePsm: 5150, mapX: 49, mapY: 20 },
};

// Real typical floor areas per flat type in Singapore HDB housing
export const FLAT_TYPE_SPECS: Record<FlatType, { minSqm: number; maxSqm: number; avgSqm: number }> = {
  '2 ROOM': { minSqm: 38, maxSqm: 48, avgSqm: 45 },
  '3 ROOM': { minSqm: 60, maxSqm: 72, avgSqm: 68 },
  '4 ROOM': { minSqm: 90, maxSqm: 104, avgSqm: 93 },
  '5 ROOM': { minSqm: 110, maxSqm: 125, avgSqm: 115 },
  'EXECUTIVE': { minSqm: 135, maxSqm: 155, avgSqm: 142 },
};

// Streets by town for authentic address generation
const TOWN_STREETS: Record<string, string[]> = {
  'ANG MO KIO': ['ANG MO KIO AVE 3', 'ANG MO KIO AVE 10', 'ANG MO KIO AVE 4', 'ANG MO KIO AVE 1'],
  'BEDOK': ['BEDOK RESERVOIR RD', 'BEDOK NORTH ST 3', 'BEDOK SOUTH AVE 2', 'NEW CHAI CHEE WAY'],
  'BISHAN': ['BISHAN ST 12', 'BISHAN ST 22', 'BISHAN ST 13', 'BRIGHT HILL DRIVE'],
  'BUKIT BATOK': ['BUKIT BATOK WEST AVE 6', 'BUKIT BATOK EAST AVE 5', 'BUKIT BATOK CENTRAL'],
  'BUKIT MERAH': ['TELOK BLANGAH DR', 'JALAN MEMBINA', 'HENDERSON RD', 'HAVELOCK RD'],
  'BUKIT PANJANG': ['JELEBU RD', 'SENJA RD', 'FAJAR RD', 'PETIR RD'],
  'CHOA CHU KANG': ['CHOA CHU KANG AVE 4', 'KEAT HONG CL', 'TECK WHYE LANE'],
  'CLEMENTI': ['CLEMENTI AVE 3', 'CLEMENTI AVE 5', 'CLEMENTI WEST ST 1'],
  'GEYLANG': ['ALJUNIED CRES', 'CIRCUIT RD', 'EUNOS CRES', 'PINE CL'],
  'HOUGANG': ['HOUGANG AVE 8', 'HOUGANG ST 51', 'UPP SERANGOON RD'],
  'JURONG EAST': ['JURONG EAST ST 32', 'TOH GUAN RD', 'JURONG EAST AVE 1'],
  'JURONG WEST': ['JURONG WEST ST 65', 'BOON LAY DR', 'JURONG WEST ST 91'],
  'KALLANG/WHAMPOA': ['BOON KENG RD', 'LOR 1 GEYLANG', 'WHAMPOA DR', 'BENDEMEER RD'],
  'PASIR RIS': ['PASIR RIS ST 11', 'PASIR RIS DR 6', 'PASIR RIS ST 71'],
  'PUNGGOL': ['PUNGGOL FIELD', 'PUNGGOL WALK', 'SUMANG WALK', 'EDGEDALE PLAINS'],
  'QUEENSTOWN': ['STRATHMORE AVE', 'GHIM MOH LINK', 'COMMONWEALTH DR', 'DAWSON RD'],
  'SEMBAWANG': ['SEMBAWANG DR', 'CANBERRA ST', 'CANBERRA WAY'],
  'SENGKANG': ['COMPASSVALE CRES', 'ANCHORVALE LINK', 'RIVERVALE DR', 'FERNVALE RD'],
  'SERANGOON': ['SERANGOON AVE 2', 'SERANGOON CENTRAL', 'LOR CHUAN'],
  'TAMPINES': ['TAMPINES ST 21', 'TAMPINES AVE 7', 'TAMPINES ST 86', 'TAMPINES CENTRAL 7'],
  'TOA PAYOH': ['LOR 2 TOA PAYOH', 'TOA PAYOH EAST', 'LOR 6 TOA PAYOH'],
  'WOODLANDS': ['WOODLANDS AVE 6', 'WOODLANDS RING RD', 'WOODLANDS DR 50'],
  'YISHUN': ['YISHUN RING RD', 'YISHUN AVE 11', 'YISHUN ST 41'],
};

// Seed dataset generator producing realistic historical & current resale records from Jan 2025 to Mar 2026
function generateRealisticTransactions(): FlatTransaction[] {
  const transactions: FlatTransaction[] = [];
  const months = [
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03'
  ];

  const towns = Object.keys(SINGAPORE_TOWNS);
  const flatTypes: FlatType[] = ['2 ROOM', '3 ROOM', '4 ROOM', '5 ROOM', 'EXECUTIVE'];
  let idCounter = 1000;

  // Monthly macro inflation index for realistic time-series trend (modest ~0.3% per month)
  const monthMultiplier: Record<string, number> = {};
  months.forEach((m, idx) => {
    monthMultiplier[m] = 1.0 + (idx * 0.0035);
  });

  towns.forEach((town) => {
    const townInfo = SINGAPORE_TOWNS[town];
    const streets = TOWN_STREETS[town] || [`${town} CENTRAL`];

    // Determine lease profile: mature vs non-mature
    const isNewerTown = ['PUNGGOL', 'SENGKANG', 'SEMBAWANG', 'CANBERRA'].includes(town);
    const isMatureCentral = ['QUEENSTOWN', 'BUKIT MERAH', 'BISHAN', 'TOA PAYOH', 'KALLANG/WHAMPOA'].includes(town);

    flatTypes.forEach((flatType) => {
      // Not all towns have executive or 2-room flats in high quantities
      if (flatType === 'EXECUTIVE' && isMatureCentral) return; // Rare in mature central
      if (flatType === '2 ROOM' && town === 'PASIR RIS') return;

      const specs = FLAT_TYPE_SPECS[flatType];
      
      // Determine base lease start year
      const baseYear = isNewerTown ? 2015 : (isMatureCentral ? 1985 : 1996);

      // Generate 4-8 representative transactions across the time periods for each town x flat_type combo
      const sampleCount = isNewerTown || ['TAMPINES', 'BEDOK', 'WOODLANDS'].includes(town) ? 6 : 4;

      for (let i = 0; i < sampleCount; i++) {
        idCounter++;
        const month = months[(idCounter + i * 3) % months.length];
        const street = streets[i % streets.length];
        const block = `${Math.floor(100 + ((idCounter * 17) % 700))}`;
        const storeyRanges = ['01 TO 03', '04 TO 06', '07 TO 09', '10 TO 12', '13 TO 15', '19 TO 21'];
        const storey = storeyRanges[(i + idCounter) % storeyRanges.length];
        const storeyBonus = storey.includes('19 TO 21') ? 1.08 : (storey.includes('10 TO 12') ? 1.04 : 1.0);

        // Floor area
        const floorArea = Math.round(specs.minSqm + (((idCounter * 7) % 100) / 100) * (specs.maxSqm - specs.minSqm));
        
        // Lease start and remaining calculation
        const leaseStartYear = baseYear + ((i * 4) % 12);
        const currentYear = 2026;
        const currentMonthNum = 3;
        const totalLeaseYears = 99;
        const elapsedYears = (currentYear - leaseStartYear) + (currentMonthNum / 12);
        const remainingYearsExact = Math.max(45, totalLeaseYears - elapsedYears);
        const remainingLeaseYears = Math.floor(remainingYearsExact);
        const remainingLeaseMonths = Math.floor((remainingYearsExact - remainingLeaseYears) * 12);

        // Bala's Curve lease factor approximation (Singapore SLA Table)
        const leaseFactor = Math.min(1.0, 0.45 + (remainingLeaseYears / 99) * 0.55);

        // Base price calculation: floorArea * avgBasePsm * multipliers
        const macroFactor = monthMultiplier[month] || 1.0;
        const rawPsm = townInfo.avgBasePsm * (0.92 + ((idCounter % 15) / 100)) * storeyBonus * macroFactor;
        const adjustedPsm = Math.round(rawPsm * (0.8 + (leaseFactor * 0.2)));
        const resalePrice = Math.round((adjustedPsm * floorArea) / 1000) * 1000;

        // Geocoded Coordinates with slight jitter around town centroid
        const latJitter = ((idCounter % 20) - 10) * 0.0015;
        const lngJitter = (((idCounter * 3) % 20) - 10) * 0.0015;
        const lat = +(townInfo.lat + latJitter).toFixed(5);
        const lng = +(townInfo.lng + lngJitter).toFixed(5);

        // SVY21 projection jitter
        const svy21_e = Math.round(townInfo.svy21_e + (lngJitter * 105000));
        const svy21_n = Math.round(townInfo.svy21_n + (latJitter * 110000));

        // Flat model
        let model = 'Model A';
        if (flatType === '3 ROOM') model = leaseStartYear < 1990 ? 'New Generation' : 'Model A';
        if (flatType === '4 ROOM' && isNewerTown) model = 'Premium Apartment';
        if (flatType === 'EXECUTIVE') model = 'Maisonette';
        if (isMatureCentral && storey.includes('19 TO 21')) model = 'DBSS / Premium';

        // Annotation presets
        let annotation = '';
        const tags: string[] = [];
        if (isMatureCentral && resalePrice > 900000) {
          tags.push('Prime Mature Estate', 'Walk to MRT');
          annotation = 'Prime central location with high connectivity and established amenities.';
        } else if (remainingLeaseYears > 88) {
          tags.push('Young Lease (>85 Yrs)', 'CPF Maximizer');
          annotation = 'Recent MOP cluster with pristine lease balance and modern open layouts.';
        } else if (adjustedPsm < 5200) {
          tags.push('High Value $/SQM', 'Budget Friendly');
          annotation = 'Below median town rate per square meter, strong value entry.';
        } else if (floorArea >= 115) {
          tags.push('Spacious Floorplan');
          annotation = 'Generous living and utility spaces suited for multi-generational families.';
        }

        transactions.push({
          id: `HDB-${town.substring(0, 3)}-${idCounter}`,
          month,
          town,
          flat_type: flatType,
          block,
          street_name: street,
          storey_range: storey,
          floor_area_sqm: floorArea,
          flat_model: model,
          lease_commence_date: leaseStartYear,
          remaining_lease_years: remainingLeaseYears,
          remaining_lease_months: remainingLeaseMonths,
          resale_price: resalePrice,
          price_per_sqm: adjustedPsm,
          lat,
          lng,
          svy21_easting: svy21_e,
          svy21_northing: svy21_n,
          annotation,
          tags,
        });
      }
    });
  });

  return transactions;
}

export const HOUSING_DATASET: FlatTransaction[] = generateRealisticTransactions();

// Precalculated town aggregates
export function getTownSummaries(dataset: FlatTransaction[] = HOUSING_DATASET): TownSummary[] {
  const towns = Object.keys(SINGAPORE_TOWNS);
  return towns.map(town => {
    const townData = SINGAPORE_TOWNS[town];
    const txs = dataset.filter(t => t.town === town);
    if (txs.length === 0) {
      return {
        name: town,
        region: townData.region,
        medianPrice: 500000,
        medianPsm: townData.avgBasePsm,
        avgLeaseRemaining: 75,
        totalTransactions: 0,
        lat: townData.lat,
        lng: townData.lng,
        svy21_easting: townData.svy21_e,
        svy21_northing: townData.svy21_n,
        popularFlatTypes: ['4 ROOM', '3 ROOM'],
      };
    }

    const sortedPrices = [...txs.map(t => t.resale_price)].sort((a, b) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
    const avgPsm = Math.round(txs.reduce((sum, t) => sum + t.price_per_sqm, 0) / txs.length);
    const avgLease = +(txs.reduce((sum, t) => sum + t.remaining_lease_years, 0) / txs.length).toFixed(1);

    const typeCounts: Record<FlatType, number> = {
      '2 ROOM': 0, '3 ROOM': 0, '4 ROOM': 0, '5 ROOM': 0, 'EXECUTIVE': 0
    };
    txs.forEach(t => { typeCounts[t.flat_type] = (typeCounts[t.flat_type] || 0) + 1; });
    const popularFlatTypes = (Object.keys(typeCounts) as FlatType[])
      .sort((a, b) => typeCounts[b] - typeCounts[a])
      .slice(0, 3);

    return {
      name: town,
      region: townData.region,
      medianPrice,
      medianPsm: avgPsm,
      avgLeaseRemaining: avgLease,
      totalTransactions: txs.length,
      lat: townData.lat,
      lng: townData.lng,
      svy21_easting: townData.svy21_e,
      svy21_northing: townData.svy21_n,
      popularFlatTypes,
    };
  });
}
