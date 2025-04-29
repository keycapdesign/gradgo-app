// Configuration for different universities and their gown components
export const eventConfigs = {
    ARU: {
        gownCodes: { BA: 'B2', MA: 'M2', PHD: 'PHD' },
        capColor: 'NAV',
        phdGownPrefix: '01-ARU-GWN'
    },
    AST: {
        gownCodes: { BA: 'D7', MA: 'D7', PHD: 'PHD' },
        capColor: 'BLK',
        phdGownPrefix: '01-AST-GWN'
    },
    BTH: {
        gownCodes: { BA: 'B8', MA: 'M2', PHD: 'PHD', DBA: 'DBA' },
        capColor: 'BLK',
        phdGownPrefix: '01-BTH-GWN',
        useTudorBonnetFor: ['PHD', 'DBA']
    },
    EXE: {
        gownCodes: { BA: 'B2', MA: 'M2', PHD: 'PHD' },
        capColor: 'BLK',
        hoodPrefix: '01-EXE-HD',
        phdGownPrefix: '01-EXE-GWN'
    },
    LAN: {
        gownCodes: {
            BA: 'B8',
            MA: 'M11',
            MPHIL: 'M11R',
            PHD: 'PHD'
        },
        capColor: 'BLK',
        phdGownPrefix: '01-NOR-GWN',
        tudorBonnetColor: 'RED',
        maLevelDegrees: ['MSCI', 'MARTS', 'MENG', 'MA', 'MSC', 'MBA', 'LLM', 'MPHIL', 'PGDC']
    },
    LAW: {
        gownCodes: { BA: 'B8', MA: 'M10' },
        capColor: 'BLK',
        hoodPrefix: '01-LAW-HD',
        maLevelDegrees: ['PGCERT', 'PGDEG', 'PGDIP']
    },
    NHAM: {
        gownCodes: {
            BA: 'B4',
            MA: 'M2',
            MPHIL: 'M2B',
            PHD: 'PHD'
        },
        capColor: 'BLK',
        phdGownPrefix: '01-NOR-GWN',
        hoodPrefix: '01-NOR-HD',
        tudorBonnetColor: 'MBLU',
        useTudorBonnetFor: ['PHD', 'DBA'],
        maLevelDegrees: ['MA', 'MBA', 'MSC', 'MENG', 'MPHIL', 'LLM', 'PGRES', 'PGCE', 'PGDC']
    },
    NTU: {
        gownCodes: { BA: 'B4', MA: 'M2', PHD: 'PHD' },
        capColor: 'BLK',
        tudorBonnetColor: 'PNK',
        hoodPrefix: '02-NTU-HD',
        phdGownPrefix: '02-NTU-GWN',
        useTudorBonnetFor: ['PHD'],
        maLevelDegrees: ['MDEG', 'PGDC']
    },
    PORT: {
        gownCodes: { BA: 'B8', MA: 'M10', PHD: 'PHD' },
        capColor: 'BLK',
        tudorBonnetColor: 'PURC',
        hoodPrefix: '01-POR-HD',
        phdGownPrefix: '01-POR-GWN',
        useTudorBonnetFor: ['PHD', 'MD'],
        maLevelDegrees: ['MA', 'MBA', 'MENG', 'MPHIL', 'LLM', 'MRES', 'MSCI', 'MPA']
    },
    SAL: {
        gownCodes: { BA: 'B4', MA: 'M2', PHD: 'PHD' },
        capColor: 'BLK',
        hoodPrefix: '02-SAL-HD',
        phdGownPrefix: '02-SAL-GWN',
        useTudorBonnetFor: ['PHD'],
        maLevelDegrees: ['MDEG', 'MRES', 'MSCI', 'PGDC']
    },
    STF: {
        gownCodes: { BA: 'B8', MA: 'M10', PHD: 'PHD' },
        capColor: 'BLK',
        tudorBonnetColor: 'MAR',
        hoodPrefix: '01-STF-HD',
        phdGownPrefix: '01-STF-GWN',
        useTudorBonnetFor: ['PHD'],
        maLevelDegrees: ['MSC', 'MSCI', 'MPHIL', 'MDEG']
    },
    STN: {
        gownCodes: { BA: 'B4S', MA: 'M1S', PHD: 'PHD' },
        capColor: 'BLK',
        tudorBonnetColor: 'MAR',
        hoodPrefix: '01-STN-HD',
        phdGownPrefix: '01-STN-GWN',
        useTudorBonnetFor: ['PHD'],
        maLevelDegrees: ['LLM', 'MA', 'MCH', 'MEDSC', 'MENG', 'MMUS', 'MPHIL', 'MSC', 'MSCI', 'MSOCSC', 'MSOCSCI']
    },
    YSJ: {
        gownCodes: { BA: 'B4', MA: 'M2', PHD: 'PHD' },
        capColor: 'BLK',
        tudorBonnetColor: 'DGD',
        phdGownPrefix: '02-YSJ-GWN',
        hoodPrefix: '02-YSJ-HD',
        useTudorBonnetFor: ['PHD'],
        maLevelDegrees: ['MDEG', 'PGDC']
    }
};

// Function to break down SKUs into their component parts
export function breakdownSkus(skuList: { ean: string, count: number }[]) {
    function parseSkuParts(sku: string) {
        sku = sku.replace(/^"|"$/g, '');
        let parts = sku.split('-');

        while (parts[0] === 'HIRE' || parts[0] === 'GA') {
            parts.shift();
        }

        let prefix = '';
        if (/^\d{2}$/.test(parts[0])) {
            prefix = parts.shift() || '';
        }

        const eventCode = parts.shift() || '';
        const event = prefix ? `${prefix}-${eventCode}` : eventCode;
        parts = parts.filter(part => part !== 'SET');

        const degree = parts.shift() || '';
        let gownCode = '';
        let size = '';
        let capSize = '';

        if (parts.length === 3) {
            gownCode = parts.shift() || '';
            size = parts.shift() || '';
            capSize = parts.shift() || '';
        } else if (parts.length === 2) {
            size = parts.shift() || '';
            capSize = parts.shift() || '';
        } else {
            throw new Error(`Missing SKU components in SKU: ${sku}`);
        }

        return { event, degree, gownCode, size, capSize };
    }

    function getDegreeType(degree: string, eventConfig: any) {
        if (eventConfig?.maLevelDegrees?.includes(degree)) return 'MA';
        if (degree === 'PHD' || degree === 'DBA' || degree === 'MD') return 'PHD';
        if (degree === 'MPHIL') return 'MPHIL';
        return 'BA';
    }

    function compareSizes(a: string, b: string) {
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
        return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
    }

    function consolidateItems(items: { sku: string, count: number }[]) {
        const consolidated: Record<string, { sku: string, count: number }> = {};
        items.forEach(item => {
            const { sku, count } = item;
            if (consolidated[sku]) {
                consolidated[sku].count += count;
            } else {
                consolidated[sku] = { sku, count };
            }
        });

        return Object.values(consolidated).sort((a, b) => {
            const sizeA = a.sku.split('-').pop() || '';
            const sizeB = b.sku.split('-').pop() || '';
            return compareSizes(sizeA, sizeB);
        });
    }

    const rawResults = skuList.map(item => {
        const { ean, count } = item;

        try {
            const parts = parseSkuParts(ean);
            const eventConfig = (eventConfigs as any)[parts.event];
            const degreeType = getDegreeType(parts.degree, eventConfig);
            let hood, gown, cap;

            const hoodPrefix = eventConfig?.hoodPrefix || `${parts.event}-HD`;
            const phdGownPrefix = eventConfig?.phdGownPrefix || `GA-${parts.event}-GWN`;
            hood = `${hoodPrefix}-${parts.degree}`;

            const defaultGownCodes = { BA: 'B4', MA: 'M2', PHD: 'PHD' };
            const gownCodes = eventConfig?.gownCodes || defaultGownCodes;
            const gownCode = parts.gownCode || gownCodes[degreeType as keyof typeof gownCodes] || gownCodes.BA;

            if (degreeType === 'PHD') {
                gown = `${phdGownPrefix}-${gownCode}-${parts.size}`;
            } else {
                gown = `GA-GWN-${gownCode}-${parts.size}`;
            }

            const capColor = eventConfig?.capColor || 'BLK';
            const tudorBonnetColor = eventConfig?.tudorBonnetColor || 'BLK';
            const useTudorBonnetFor = eventConfig?.useTudorBonnetFor || ['PHD'];

            if (useTudorBonnetFor.includes(degreeType)) {
                cap = `GA-TB-BLK-${tudorBonnetColor}-${parts.capSize}`;
            } else {
                cap = `GA-FMB-${capColor}-${parts.capSize}`;
            }

            return {
                parentSku: ean,
                count,
                childSkus: {
                    hood: { sku: hood, count },
                    gown: { sku: gown, count },
                    cap: { sku: cap, count }
                }
            };
        } catch (error) {
            console.error(error instanceof Error ? error.message : 'Unknown error');
            return null;
        }
    }).filter(item => item !== null) as any[];

    const hoods: { sku: string, count: number }[] = [];
    const gowns: { sku: string, count: number }[] = [];
    const caps: { sku: string, count: number }[] = [];

    rawResults.forEach(item => {
        hoods.push({
            sku: item.childSkus.hood.sku,
            count: item.childSkus.hood.count
        });
        gowns.push({
            sku: item.childSkus.gown.sku,
            count: item.childSkus.gown.count
        });
        caps.push({
            sku: item.childSkus.cap.sku,
            count: item.childSkus.cap.count
        });
    });

    return {
        hoods: consolidateItems(hoods),
        gowns: consolidateItems(gowns),
        caps: consolidateItems(caps)
    };
}
