// Champion data structure
export interface Champion {
    id: number;
    name: string;
    role?: string;
    riotId?: number; // Real Riot API ID for mastery matching
}

// Mock champions data - this will be replaced with API call later
const mockChampions: Champion[] = [
    { id: 1, name: "Aatrox", role: "top" },
    { id: 2, name: "Ahri", role: "mid" },
    { id: 3, name: "Akali", role: "mid" },
    { id: 4, name: "Akshan", role: "mid" },
    { id: 5, name: "Alistar", role: "support" },
    { id: 6, name: "Amumu", role: "jungle" },
    { id: 7, name: "Anivia", role: "mid" },
    { id: 8, name: "Annie", role: "mid" },
    { id: 9, name: "Aphelios", role: "adc" },
    { id: 10, name: "Ashe", role: "adc" },
    { id: 11, name: "Aurelion Sol", role: "mid" },
    { id: 12, name: "Azir", role: "mid" },
    { id: 13, name: "Bard", role: "support" },
    { id: 14, name: "Bel'Veth", role: "jungle" },
    { id: 15, name: "Blitzcrank", role: "support" },
    { id: 16, name: "Brand", role: "support" },
    { id: 17, name: "Braum", role: "support" },
    { id: 18, name: "Caitlyn", role: "adc" },
    { id: 19, name: "Camille", role: "top" },
    { id: 20, name: "Cassiopeia", role: "mid" },
    { id: 21, name: "Cho'Gath", role: "top" },
    { id: 22, name: "Corki", role: "mid" },
    { id: 23, name: "Darius", role: "top" },
    { id: 24, name: "Diana", role: "jungle" },
    { id: 25, name: "Dr. Mundo", role: "top" },
    { id: 26, name: "Draven", role: "adc" },
    { id: 27, name: "Ekko", role: "jungle" },
    { id: 28, name: "Elise", role: "jungle" },
    { id: 29, name: "Evelynn", role: "jungle" },
    { id: 30, name: "Ezreal", role: "adc" },
    { id: 31, name: "Fiddlesticks" },
    { id: 32, name: "Fiora" },
    { id: 33, name: "Fizz" },
    { id: 34, name: "Galio" },
    { id: 35, name: "Gangplank" },
    { id: 36, name: "Garen" },
    { id: 37, name: "Gnar" },
    { id: 38, name: "Gragas" },
    { id: 39, name: "Graves" },
    { id: 40, name: "Gwen" },
    { id: 41, name: "Hecarim" },
    { id: 42, name: "Heimerdinger" },
    { id: 43, name: "Illaoi" },
    { id: 44, name: "Irelia" },
    { id: 45, name: "Ivern" },
    { id: 46, name: "Janna" },
    { id: 47, name: "Jarvan IV" },
    { id: 48, name: "Jax" },
    { id: 49, name: "Jayce" },
    { id: 50, name: "Jhin" },
    { id: 51, name: "Jinx" },
    { id: 52, name: "K'Sante" },
    { id: 53, name: "Kai'Sa" },
    { id: 54, name: "Kalista" },
    { id: 55, name: "Karma" },
    { id: 56, name: "Karthus" },
    { id: 57, name: "Kassadin" },
    { id: 58, name: "Katarina" },
    { id: 59, name: "Kayle" },
    { id: 60, name: "Kayn" },
    { id: 61, name: "Kennen" },
    { id: 62, name: "Kha'Zix" },
    { id: 63, name: "Kindred" },
    { id: 64, name: "Kled" },
    { id: 65, name: "Kog'Maw" },
    { id: 66, name: "LeBlanc" },
    { id: 67, name: "Lee Sin" },
    { id: 68, name: "Leona" },
    { id: 69, name: "Lillia" },
    { id: 70, name: "Lissandra" },
    { id: 71, name: "Lucian" },
    { id: 72, name: "Lulu" },
    { id: 73, name: "Lux" },
    { id: 74, name: "Malphite" },
    { id: 75, name: "Malzahar" },
    { id: 76, name: "Maokai" },
    { id: 77, name: "Master Yi" },
    { id: 78, name: "Milio" },
    { id: 79, name: "Miss Fortune" },
    { id: 80, name: "Mordekaiser" },
    { id: 81, name: "Morgana" },
    { id: 82, name: "Nami" },
    { id: 83, name: "Nasus" },
    { id: 84, name: "Nautilus" },
    { id: 85, name: "Neeko" },
    { id: 86, name: "Nidalee" },
    { id: 87, name: "Nilah" },
    { id: 88, name: "Nocturne" },
    { id: 89, name: "Nunu & Willump" },
    { id: 90, name: "Olaf" },
    { id: 91, name: "Orianna" },
    { id: 92, name: "Ornn" },
    { id: 93, name: "Pantheon" },
    { id: 94, name: "Poppy" },
    { id: 95, name: "Pyke" },
    { id: 96, name: "Qiyana" },
    { id: 97, name: "Quinn" },
    { id: 98, name: "Rakan" },
    { id: 99, name: "Rammus" },
    { id: 100, name: "Rek'Sai" },
    { id: 101, name: "Rell" },
    { id: 102, name: "Renata Glasc" },
    { id: 103, name: "Renekton" },
    { id: 104, name: "Rengar" },
    { id: 105, name: "Riven" },
    { id: 106, name: "Rumble" },
    { id: 107, name: "Ryze" },
    { id: 108, name: "Samira" },
    { id: 109, name: "Sejuani" },
    { id: 110, name: "Senna" },
    { id: 111, name: "Seraphine" },
    { id: 112, name: "Sett" },
    { id: 113, name: "Shaco" },
    { id: 114, name: "Shen" },
    { id: 115, name: "Shyvana" },
    { id: 116, name: "Singed" },
    { id: 117, name: "Sion" },
    { id: 118, name: "Sivir" },
    { id: 119, name: "Skarner" },
    { id: 120, name: "Sona" },
    { id: 121, name: "Soraka" },
    { id: 122, name: "Swain" },
    { id: 123, name: "Sylas" },
    { id: 124, name: "Syndra" },
    { id: 125, name: "Tahm Kench" },
    { id: 126, name: "Taliyah" },
    { id: 127, name: "Talon" },
    { id: 128, name: "Taric" },
    { id: 129, name: "Teemo" },
    { id: 130, name: "Thresh" },
    { id: 131, name: "Tristana" },
    { id: 132, name: "Trundle" },
    { id: 133, name: "Tryndamere" },
    { id: 134, name: "Twisted Fate" },
    { id: 135, name: "Twitch" },
    { id: 136, name: "Udyr" },
    { id: 137, name: "Urgot" },
    { id: 138, name: "Varus" },
    { id: 139, name: "Vayne" },
    { id: 140, name: "Veigar" },
    { id: 141, name: "Vel'Koz" },
    { id: 142, name: "Vex" },
    { id: 143, name: "Vi" },
    { id: 144, name: "Viego" },
    { id: 145, name: "Viktor" },
    { id: 146, name: "Vladimir" },
    { id: 147, name: "Volibear" },
    { id: 148, name: "Warwick" },
    { id: 149, name: "Wukong" },
    { id: 150, name: "Xayah" },
    { id: 151, name: "Xerath" },
    { id: 152, name: "Xin Zhao" },
    { id: 153, name: "Yasuo" },
    { id: 154, name: "Yone" },
    { id: 155, name: "Yorick" },
    { id: 156, name: "Yuumi" },
    { id: 157, name: "Zac" },
    { id: 158, name: "Zed" },
    { id: 159, name: "Zeri" },
    { id: 160, name: "Ziggs" },
    { id: 161, name: "Zilean" },
    { id: 162, name: "Zoe" },
    { id: 163, name: "Zyra" }
];

// Function to fetch champions - will be replaced with API call
export const fetchChampions = async (): Promise<Champion[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return mock data - replace this with actual API call later
    return mockChampions;
};

// Function to get champions by IDs (for specific bloodline data)
export const getChampionsByIds = (ids: number[]): Champion[] => {
    return mockChampions.filter(champion => ids.includes(champion.id));
};

// Mapping from sequential ID to real Riot API ID
// Complete mapping based on League of Legends champion IDs
const championIdMapping: { [key: number]: number } = {
    1: 266,    // Aatrox
    2: 103,    // Ahri
    3: 84,     // Akali
    4: 166,    // Akshan
    5: 12,     // Alistar
    6: 32,     // Ammu
    7: 34,     // Anivia
    8: 1,      // Annie
    9: 523,    // Aphelios
    10: 22,    // Ashe
    11: 136,   // Aurelion Sol
    12: 268,   // Azir
    13: 432,   // Bard
    14: 200,   // Bel'Veth
    15: 53,    // Blitzcrank
    16: 63,    // Brand
    17: 201,   // Braum
    18: 51,    // Caitlyn
    19: 164,   // Camille
    20: 69,    // Cassiopeia
    21: 31,    // Cho'Gath
    22: 42,    // Corki
    23: 122,   // Darius
    24: 131,   // Diana
    25: 36,    // Dr. Mundo
    26: 119,   // Draven
    27: 245,   // Ekko
    28: 60,    // Elise
    29: 28,    // Evelynn
    30: 81,    // Ezreal
    31: 9,     // Fiddlesticks
    32: 114,   // Fiora
    33: 105,   // Fizz
    34: 3,     // Galio
    35: 41,    // Gangplank
    36: 86,    // Garen
    37: 150,   // Gnar
    38: 79,    // Gragas
    39: 104,   // Graves
    40: 887,   // Gwen
    41: 120,   // Hecarim
    42: 74,    // Heimerdinger
    43: 420,   // Illaoi
    44: 39,    // Irelia
    45: 427,   // Ivern
    46: 40,    // Janna
    47: 59,    // Jarvan IV
    48: 24,    // Jax
    49: 126,   // Jayce
    50: 202,   // Jhin
    51: 222,   // Jinx
    52: 897,   // K'Sante
    53: 145,   // Kai'Sa
    54: 429,   // Kalista
    55: 43,    // Karma
    56: 30,    // Karthus
    57: 38,    // Kassadin
    58: 55,    // Katarina
    59: 10,    // Kayle
    60: 141,   // Kayn
    61: 85,    // Kennen
    62: 121,   // Kha'Zix
    63: 203,   // Kindred
    64: 240,   // Kled
    65: 96,    // Kog'Maw
    66: 7,     // LeBlanc
    67: 64,    // Lee Sin
    68: 89,    // Leona
    69: 876,   // Lillia
    70: 127,   // Lissandra
    71: 236,   // Lucian
    72: 117,   // Lulu
    73: 99,    // Lux
    74: 54,    // Malphite
    75: 90,    // Malzahar
    76: 57,    // Maokai
    77: 11,    // Master Yi
    78: 902,   // Milio
    79: 21,    // Miss Fortune
    80: 82,    // Mordekaiser
    81: 25,    // Morgana
    82: 267,   // Nami
    83: 75,    // Nasus
    84: 111,   // Nautilus
    85: 518,   // Neeko
    86: 76,    // Nidalee
    87: 895,   // Nilah
    88: 56,    // Nocturne
    89: 20,    // Nunu & Willump
    90: 2,     // Olaf
    91: 61,    // Orianna
    92: 516,   // Ornn
    93: 80,    // Pantheon
    94: 78,    // Poppy
    95: 555,   // Pyke
    96: 246,   // Qiyana
    97: 133,   // Quinn
    98: 497,   // Rakan
    99: 33,    // Rammus
    100: 421,  // Rek'Sai
    101: 526,  // Rell
    102: 888,  // Renata Glasc
    103: 58,   // Renekton
    104: 107,  // Rengar
    105: 92,   // Riven
    106: 68,   // Rumble
    107: 13,   // Ryze
    108: 360,  // Samira
    109: 113,  // Sejuani
    110: 235,  // Senna
    111: 147,  // Seraphine
    112: 875,  // Sett
    113: 35,   // Shaco
    114: 98,   // Shen
    115: 102,  // Shyvana
    116: 27,   // Singed
    117: 14,   // Sion
    118: 15,   // Sivir
    119: 72,   // Skarner
    120: 37,   // Sona
    121: 16,   // Soraka
    122: 50,   // Swain
    123: 517,  // Sylas
    124: 134,  // Syndra
    125: 223,  // Tahm Kench
    126: 163,  // Taliyah
    127: 91,   // Talon
    128: 44,   // Taric
    129: 17,   // Teemo
    130: 412,  // Thresh
    131: 18,   // Tristana
    132: 48,   // Trundle
    133: 23,   // Tryndamere
    134: 4,    // Twisted Fate
    135: 29,   // Twitch
    136: 77,   // Udyr
    137: 6,    // Urgot
    138: 110,  // Varus
    139: 67,   // Vayne
    140: 45,   // Veigar
    141: 161,  // Vel'Koz
    142: 711,  // Vex
    143: 254,  // Vi
    144: 234,  // Viego
    145: 112,  // Viktor
    146: 8,    // Vladimir
    147: 106,  // Volibear
    148: 19,   // Warwick
    149: 62,   // Wukong
    150: 498,  // Xayah
    151: 101,  // Xerath
    152: 5,    // Xin Zhao
    153: 157,  // Yasuo
    154: 777,  // Yone
    155: 83,   // Yorick
    156: 350,  // Yuumi
    157: 154,  // Zac
    158: 238,  // Zed
    159: 221,  // Zeri
    160: 115,  // Ziggs
    161: 26,   // Zilean
    162: 142,  // Zoe
    163: 143   // Zyra
};

// Function to get the real Riot API ID for a champion
export const getRiotIdForChampion = (championId: number): number => {
    return championIdMapping[championId] || championId;
}; 