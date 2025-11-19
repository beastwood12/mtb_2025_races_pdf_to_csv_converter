// ============================================
// CORE PARSING FUNCTIONS (Extracted from race_results_extractor_v2__1_.html)
// ============================================

function cleanTeamName(team) {
    if (!team || team === '-') return '';
    
    // Remove trailing dashes and spaces
    team = team.replace(/(\s+-)+\s*$/g, '');
    
    team = team.replace(/\s+High\s+School$/i, '');
    team = team.replace(/\s+HS$/i, '');
    team = team.replace(/\s+Jr\s+Devo$/i, '');
    team = team.replace(/\s+Junior\s+Devo$/i, '');
    team = team.replace(/\s+Mountain\s+Bike\s+Team$/i, '');
    
    return team.trim();
}

function convertTime(timeStr) {
    if (!timeStr || timeStr === '-') return '';
    
    // Check for invalid time formats (e.g., x:xx:xx)
    // Valid times should only contain digits, colons, and periods
    if (!/^[\d:\.]+$/.test(timeStr)) {
        // Return as-is if it contains invalid characters
        return timeStr;
    }
    
    const parts = timeStr.split(':');
    if (parts.length === 3) {
        // HH:MM:SS.FF format
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = parts[2];
        
        // Check if parsing resulted in valid numbers
        if (isNaN(hours) || isNaN(minutes)) {
            return timeStr; // Return original if invalid
        }
        
        const totalMinutes = hours * 60 + minutes;
        return `${totalMinutes}:${seconds}`;
    }
    // Already in MM:SS.FF or M:SS format
    return timeStr;
}

function parseRaceResults(text, firstPageOnly = false) {
    const results = [];
    
    // Extract header info
    const headerMatch = text.match(/UTAH HS MTB (\d+)\s*-\s*REGION (\d+)\s*-\s*(\w+)/);
    const year = headerMatch ? headerMatch[1] : '';
    const region = headerMatch ? headerMatch[2] : '';
    const location = headerMatch ? headerMatch[3] : '';
    
    // Split into lines
    const lines = text.split(/\n/);
    let currentCategory = '';
    
    // Match category headers
    const categoryPattern = /^((?:Sr\.|Freshman|JV|Sophomore|Varsity|Beginner|Intermediate|Advanced|SLR).*(?:Boys|Girls|7th Grade|8th Grade))$/i;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip header row
        if (line.includes('PLC NO NAME TEAM') || line.includes('UTAH HS MTB') || 
            line.includes('Individual Results') || !line) {
            continue;
        }
        
        // Check for category header
        const catMatch = line.match(categoryPattern);
        if (catMatch) {
            currentCategory = catMatch[1].trim();
            console.log('Found category:', currentCategory);
            continue;
        }
        
        // Parse data row
        const parts = line.split(/\s+/);
        
        // First part should be a number or * (for DNF)
        if (parts.length >= 8 && (parts[0].match(/^\d+$/) || parts[0] === '*')) {
            
            // FIX #2: Special handling for DNF entries
            if (parts[parts.length - 1] === 'DNF') {
                const placement = parts[0];
                const plateNum = parts[1];
                
                // Find first dash or DNF (where laps/DNF section starts)
                let firstDashIdx = -1;
                for (let j = 2; j < parts.length; j++) {
                    if (parts[j] === '-' || parts[j] === 'DNF') {
                        firstDashIdx = j;
                        break;
                    }
                }
                
                // Everything between plate# and first dash is name + team (possibly + points)
                let middleParts = [];
                if (firstDashIdx > 2) {
                    middleParts = parts.slice(2, firstDashIdx);
                }
                
                // Check if the last element of middleParts is a 3-digit number (Points)
                let points = '';
                let teamEndIdx = middleParts.length;
                
                if (middleParts.length > 2 && middleParts[middleParts.length - 1].match(/^\d{3}$/)) {
                    // Last element is points, exclude it from name/team parsing
                    points = middleParts[middleParts.length - 1];
                    teamEndIdx = middleParts.length - 1;
                }
                
                // Extract name and team (excluding points if found)
                const nameTeamParts = middleParts.slice(0, teamEndIdx);
                const name = nameTeamParts.slice(0, 2).join(' ');
                const team = cleanTeamName(nameTeamParts.slice(2).join(' '));
                
                const result = {
                    Year: year,
                    Region: region,
                    Location: location,
                    'Race Category': currentCategory,
                    Placement: placement,
                    'Plate#': plateNum,
                    Name: name,
                    Team: team,
                    Points: points,
                    LAP1: '',
                    LAP2: '',
                    LAP3: '',
                    LAP4: '',
                    Penalty: '',
                    'Total Time': 'DNF'
                };
                
                results.push(result);
                console.log(`Parsed DNF: ${placement} ${plateNum} "${name}" "${team}" Points:${points || 'blank'}`);
                
                if (firstPageOnly && results.length >= 20) {
                    break;
                }
                continue;  // Skip the rest of the parsing logic
            }
            
            const placement = parts[0];
            const plateNum = parts[1];
            
            // FIX #3: Find first time, 3-digit number, dash, or "DNF" after NO
            let ptsIdx = -1;
            let teamEndIdx = -1;
            
            for (let j = 2; j < parts.length; j++) {
                // Check for 3-digit number followed by time or dash
                if (parts[j].match(/^\d{3}$/) && j + 1 < parts.length && 
                    (parts[j + 1].match(/^\d+:\d+/) || parts[j + 1] === '-')) {
                    ptsIdx = j;
                    teamEndIdx = j - 1;
                    break;
                }
                // Check for FIRST dash or time (improved logic)
                if (parts[j] === '-' || (parts[j].match(/^\d+:\d+/) && 
                    (!parts[j - 1] || !parts[j - 1].match(/^\d{3}$/)))) {
                    ptsIdx = j;
                    teamEndIdx = j - 1;
                    break;
                }
                // Check for DNF (should have been caught by special handler above)
                if (parts[j] === 'DNF') {
                    ptsIdx = j;
                    teamEndIdx = j - 1;
                    break;
                }
            }
            
            if (ptsIdx === -1 || teamEndIdx < 2) continue;
            
            // Build the middle section (between NO and PTS/LAP1)
            const middleParts = parts.slice(2, teamEndIdx + 1);
            
            // Strategy: Assume rider name is 2 words (First Last)
            // Everything else is team name
            let nameEndIdx = 1; // Default: first 2 words are name
            let teamStartIdx = 2; // Rest is team
            
            // If we have fewer than 2 words in middle, adjust
            if (middleParts.length < 2) {
                nameEndIdx = 0;
                teamStartIdx = 1;
            }
            
            // Extract name and team
            const name = middleParts.slice(0, nameEndIdx + 1).join(' ');
            const team = cleanTeamName(middleParts.slice(teamStartIdx).join(' '));
            
            // Check if PTS exists or is blank
            let actualPtsIdx = -1;
            let actualLap1Idx = ptsIdx;
            
            if (parts[ptsIdx].match(/^\d{3}$/)) {
                // It's a 3-digit number, so this is PTS
                actualPtsIdx = ptsIdx;
                actualLap1Idx = ptsIdx + 1;
            } else {
                // It's a time, so PTS is blank and this is LAP1
                actualPtsIdx = -1;
                actualLap1Idx = ptsIdx;
            }
            
            // Extract values working from the END backwards
            const totalTime = parts[parts.length - 1]; // Last element is always total time
            
            // Check if second-to-last is penalty (time format, not dash)
            let penalty = '';
            let lastLapIdx = parts.length - 1; // Where laps end
            
            if (parts.length >= 2 && parts[parts.length - 2].match(/^\d+:\d+/) && parts[parts.length - 2] !== '-') {
                penalty = parts[parts.length - 2];
                lastLapIdx = parts.length - 2; // Laps end before penalty
            }
            
            // Extract points
            const points = actualPtsIdx >= 0 ? parts[actualPtsIdx] : '';
            
            // Extract lap times between actualLap1Idx and lastLapIdx
            const lapValues = [];
            for (let k = actualLap1Idx; k < lastLapIdx; k++) {
                lapValues.push(parts[k] || '');
            }
            
            // Assign to LAP1-4 (pad with empty strings if needed)
            const lap1 = lapValues[0] || '';
            const lap2 = lapValues[1] || '';
            const lap3 = lapValues[2] || '';
            const lap4 = lapValues[3] || '';
            
            const result = {
                Year: year,
                Region: region,
                Location: location,
                'Race Category': currentCategory,
                Placement: placement,
                'Plate#': plateNum,
                Name: name,
                Team: team,
                Points: points === '-' ? '' : points,
                LAP1: convertTime(lap1 === '-' ? '' : lap1),
                LAP2: convertTime(lap2 === '-' ? '' : lap2),
                LAP3: convertTime(lap3 === '-' ? '' : lap3),
                LAP4: convertTime(lap4 === '-' ? '' : lap4),
                Penalty: convertTime(penalty === '-' ? '' : penalty),
                'Total Time': totalTime === 'DNF' ? 'DNF' : convertTime(totalTime)
            };
            
            results.push(result);
            console.log(`Parsed: ${placement} ${plateNum} "${name}" "${team}" Points:${points || 'blank'}`);
            
            if (firstPageOnly && results.length >= 20) {
                break;
            }
        }
    }
    
    console.log(`Total results parsed: ${results.length}`);
    return results;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseRaceResults, cleanTeamName, convertTime };
}
