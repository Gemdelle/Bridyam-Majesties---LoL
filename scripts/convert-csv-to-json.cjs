const fs = require('fs');
const path = require('path');

const tempDataDir = path.join(__dirname, '..', 'temp-data');
const outputDir = path.join(__dirname, '..', 'public', 'data');

// Convert masteries CSV to JSON
function convertMasteries() {
    const csvPath = path.join(tempDataDir, 'masteries_rows.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n');

    const masteriesByRanked = {};

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',');
        const rankedId = parseInt(values[1]);
        const championId = parseInt(values[3]);
        const championLevel = parseInt(values[4]) || 0;
        const championPoints = parseInt(values[5]) || 0;

        if (!masteriesByRanked[rankedId]) {
            masteriesByRanked[rankedId] = {
                ranked_id: rankedId,
                username: values[2],
                masteries: []
            };
        }

        masteriesByRanked[rankedId].masteries.push({
            champion_id: championId,
            champion_level: championLevel,
            champion_points: championPoints
        });
    }

    const result = Object.values(masteriesByRanked);
    fs.writeFileSync(
        path.join(outputDir, 'masteries.json'),
        JSON.stringify(result, null, 2)
    );
    console.log(`Created masteries.json with ${result.length} accounts`);
}

// Create ranking from rankeds.json - Split 1 2026: Only wins count initially
function createRanking() {
    const rankedsPath = path.join(outputDir, 'rankeds.json');
    const rankeds = JSON.parse(fs.readFileSync(rankedsPath, 'utf-8'));
    
    // Group accounts by essencer and sum their stats
    const essencerStats = {};
    
    rankeds.forEach(r => {
        if (r.essencer === '-') return;
        
        if (!essencerStats[r.essencer]) {
            essencerStats[r.essencer] = {
                name: r.essencer,
                totalWins: 0,
                accountCount: 0
            };
        }
        
        essencerStats[r.essencer].totalWins += r.wins.current;
        essencerStats[r.essencer].accountCount += 1;
    });
    
    // Only include essencers with wins > 0
    const ranking = Object.values(essencerStats)
        .filter(e => e.totalWins > 0)
        .map(e => {
            // Split 1 2026: Only wins count (70 pts each)
            const winsScore = e.totalWins * 70;
            const totalScore = winsScore;
            
            return {
                rank: 0,
                rankedId: 0,
                rankedName: e.name,
                userId: 'local-user',
                petType: '1',
                petStage: 2,
                totalProgressScore: totalScore,
                levelGained: 0,
                honorGained: 0,
                winsGained: e.totalWins,
                soloqProgress: 0,
                flexProgress: 0,
                masteryLevelsGained: 0,
                level30BonusCount: 0,
                eloDivisionsGained: 0,
                winsScore,
                masteryScore: 0,
                honorScore: 0,
                levelScore: 0,
                memberScore: 0,
                eloScore: 0,
                redeemCount: 0,
                redeemScore: 0
            };
        })
        .sort((a, b) => b.totalProgressScore - a.totalProgressScore)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
    
    // Save ranking.json for the app
    fs.writeFileSync(
        path.join(outputDir, 'ranking.json'),
        JSON.stringify(ranking, null, 2)
    );
    
    // Save split-1-2026.json with full structure
    const splitData = {
        split: "Split 1 2026",
        lastUpdated: new Date().toISOString(),
        scoring: {
            wins: 70,
            elo: 0,
            honor: 0,
            level: 0,
            mastery: 0,
            member: 0,
            redeem: 0
        },
        ranking: ranking.map(r => ({
            rank: r.rank,
            name: r.rankedName,
            wins: r.winsGained,
            winsScore: r.winsScore,
            elo: 0,
            eloScore: 0,
            honor: 0,
            honorScore: 0,
            level: 0,
            levelScore: 0,
            mastery: 0,
            masteryScore: 0,
            member: 0,
            memberScore: 0,
            redeem: 0,
            redeemScore: 0,
            totalScore: r.totalProgressScore
        }))
    };
    
    fs.writeFileSync(
        path.join(outputDir, 'split-1-2026.json'),
        JSON.stringify(splitData, null, 2)
    );
    
    console.log(`Created ranking.json with ${ranking.length} entries (Split 1 2026 - wins only)`);
    console.log(`Created split-1-2026.json`);
}

convertMasteries();
createRanking();
console.log('Done!');
