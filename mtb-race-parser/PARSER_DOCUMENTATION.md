# MTB Race Results Parser - Documentation

## Current Status

**Version:** v2 (Fixed)  
**Last Updated:** November 17, 2025  
**Parser Type:** Browser-based PDF.js extraction → CSV output

### Current Issues
- Missing category for entries that continue from previous page (expected behavior for now)

### Recently Fixed
- ✅ **DNF entries with Points field** - now correctly extracts Points value separate from team name (e.g., "Skyridge HS 150" now parses as Team="Skyridge", Points=150)
- ✅ **Penalty column extraction** - now works backwards from end to correctly identify penalties vs lap times
- ✅ **DNF entries** - handles Did Not Finish (placement = "*", Total Time = "DNF")
- ✅ Name/Team boundary detection - now assumes 2-word names (First Last)
- ✅ Column names updated to match specification (Placement, Plate#, Points, Total Time, etc.)
- ✅ Metadata extraction (Year, Region, Location) from PDF header
- ✅ Time format conversion (HH:MM:SS.FF → MM:SS.FF)
- ✅ Team name cleaning (removes "High School", "HS", "Jr Devo", "Junior Devo", "Mountain Bike Team")
- ✅ Blank PTS values handled correctly

### What's Working
- Placement and Plate# extraction
- PTS handling (both numeric points like 200, 199 and blank values)
- Category detection for new category headers (SLR Girls, SLR Boys, Beginner 8th Grade Boys, etc.)
- LAP columns properly converting dashes to empty strings
- **Penalty extraction (works backwards from end to identify penalties correctly)**
- Basic PDF text extraction with PDF.js
- Year, Region, Location metadata extraction from header
- Time format conversion (HH:MM:SS.FF → MM:SS.FF)
- Name/Team split using 2-word name assumption
- Team name cleaning (removes suffixes)
- Correct column names in output (Placement, Plate#, Points, Total Time, etc.)
- DNF entries (placement = "*")

---

## Field Metadata

### Output Columns (in order)

| Column Name | Source Field | Data Type | Description | Notes |
|-------------|--------------|-----------|-------------|-------|
| Year | Header | Integer | Race year | Extracted from title: "UTAH HS MTB **2025**" |
| Region | Header | Integer | Region number | Extracted from title: "REGION **5**" |
| Location | Header | String | Race location | Extracted from title: e.g., "SNOWBASIN" |
| Race Category | Category Header | String | Race category | Examples: "SLR Girls", "Advanced Boys", "Varsity Boys" |
| Placement | PLC | Integer | Finishing position | Order they finished the race |
| Plate# | NO | Integer | Race plate number | Consistent throughout the year for each rider |
| Name | NAME | String | Rider name | Format: First name, then last name |
| Team | TEAM | String | High school name | See Team Cleaning Rules below |
| Points | PTS | Integer (3-digit) or Empty | Points earned | Only high school riders earn points; 3-digit number (200, 199, etc.) or empty. **If MM:SS appears here, columns are misaligned** |
| LAP1 | LAP1 | String (Time) | Lap 1 time | Format: MM:SS.FF |
| LAP2 | LAP2 | String (Time) | Lap 2 time | Format: MM:SS.FF |
| LAP3 | LAP3 | String (Time) | Lap 3 time | Format: MM:SS.FF |
| LAP4 | LAP4 | String (Time) | Lap 4 time | Format: MM:SS.FF |
| Total Time | TIME | String (Time or DNF) | Total race time | Format: MM:SS.FF. Special value: "DNF" = Did Not Finish |

### Team Cleaning Rules

Remove the following from team names:
1. Standalone "HS" (not preceded by school name)
2. "Jr Devo" or "Junior Devo" (designation for 7th/8th graders)
3. "High School" wording

**Examples:**
- "Maple Mountain High School" → "Maple Mountain"
- "North Summit High School" → "North Summit"
- "Lone Peak Jr Devo" → "Lone Peak"
- "Salem Hills HS" → "Salem Hills"
- "Sevier Valley Composite" → "Sevier Valley Composite" (no change)

### Time Format Conversion

**Input Format:** HH:MM:SS.FF (hours:minutes:seconds.fractional)  
**Output Format:** MM:SS.FF (minutes:seconds.fractional)

**Conversion Rule:** Convert hours to additional minutes

**Examples:**
- 1:30:30.10 → 90:30.10
- 0:45:30.50 → 45:30.50
- 2:15:45.75 → 135:45.75

**Note:** Different race categories have different numbers of required laps. Empty/unused lap columns should remain empty.

---

## PDF Input Format

**Header Structure:**
```
UTAH HS MTB [YEAR] - REGION [REGION#] - [LOCATION]
Individual Results
```

**Category Headers:**
- Format: Single line with category name (e.g., "SLR Girls", "Advanced Boys")
- Categories can continue across pages

**Data Row Format:**
```
PLC NO NAME TEAM PTS LAP1 LAP2 LAP3 LAP4 PEN TIME
```

**Column Details:**
- **PLC:** 1-3 digit placement number
- **NO:** 4-5 digit plate number
- **NAME:** Multi-word rider name (first + last)
- **TEAM:** Multi-word team/school name
- **PTS:** Either 3-digit number (200, 199, 198...) OR empty/missing. **If it appears as MM:SS format, columns are misaligned**
- **LAP1-4:** Time format (HH:MM:SS or MM:SS, most often MM:SS) or dash (-)
- **PEN:** Penalty time or dash (-)
- **TIME:** Total time format (HH:MM:SS.FF, MM:SS.FF, or XX:XX:XX)

---

## Known Edge Cases

1. **Multi-word names:** "ALLISON STANFORD", "MATTHEW DAVIES"
2. **Multi-word teams:** "North Summit High School", "Wasatch Mountain Bike Team"
3. **Numeric vs Time PTS:** SLR categories use points (200, 199), others use time
4. **Variable lap counts:** Some categories have 1-2 laps, others have 3-4 laps
5. **Categories spanning pages:** Category header appears once, entries continue on subsequent pages
6. **Team name variations:** "Jr Devo", "Junior Devo", "HS", "High School", "Composite"
7. **DNF entries:** Placement = "*", Total Time = "DNF" (Did Not Finish), all laps are blank
8. **DNF with Points:** DNF entries may include Points field before dashes (e.g., "* 30417 KAIDEN LARSON Skyridge HS 150 - - - - - DNF")

---

## Development Notes

**Current Approach:**
- Uses PDF.js for browser-based extraction
- Splits text by newlines based on Y-coordinates
- **Name/Team Parsing Strategy:** Assumes rider names are 2 words (First Last), everything after is team name
- Single-space splitting of PDF text
- Converts time formats from HH:MM:SS.FF to MM:SS.FF

**Name/Team Parsing Logic:**
```
Example: "PETER HOGUE Lehi Junior Devo"
Split: ["PETER", "HOGUE", "Lehi", "Junior", "Devo"]
Name: First 2 words → "PETER HOGUE"
Team (raw): Remaining words → "Lehi Junior Devo"
Team (cleaned): Apply cleaning rules → "Lehi"
```

**Lap/Penalty Extraction Logic:**
Works backwards from the end of the line to correctly identify penalties:
```
Example WITHOUT penalty:
Parts: [..., LAP1, -, -, TIME]
       Extract: LAP1=LAP1, Penalty=blank, Total Time=TIME

Example WITH penalty (5:00):
Parts: [..., LAP1, -, -, -, PENALTY, TIME]
       Extract: LAP1=LAP1, Penalty=PENALTY, Total Time=TIME

Logic:
1. Total Time = Last element (always)
2. Check if second-to-last contains ":" and is not "-"
   - If yes: Penalty = second-to-last, laps end before penalty
   - If no: Penalty = blank, laps end before total time
3. Extract LAP1-4 between start position and lap end position
```

**DNF Entry Parsing Logic:**
Special handling for Did Not Finish entries:
```
Example DNF entry:
* 30417 KAIDEN LARSON Skyridge HS 150 - - - - - DNF

Parsing steps:
1. Detect DNF: Last element is "DNF"
2. Find first dash: Marks where laps section starts
3. Extract middle section: Everything between Plate# and first dash
   Example: ["KAIDEN", "LARSON", "Skyridge", "HS", "150"]
4. Check for Points: If last element is 3-digit number, extract it
   Points = "150"
   Remaining: ["KAIDEN", "LARSON", "Skyridge", "HS"]
5. Extract name: First 2 words → "KAIDEN LARSON"
6. Extract team: Remaining words → "Skyridge HS" → cleaned → "Skyridge"
7. Set all laps to blank, Total Time to "DNF"

Result:
- Placement: "*"
- Name: "KAIDEN LARSON"
- Team: "Skyridge"
- Points: "150"
- All LAPs: blank
- Total Time: "DNF"
```

**Time Conversion Examples:**
- Input: "1:00:10.77" → Output: "60:10.77"
- Input: "0:58:45.34" → Output: "58:45.34"
- Input: "05:00" → Output: "5:00"

**Team Pattern List (for reference only - not used in current parsing):**
- "Mountain Bike Team"
- "High School"
- "Junior Devo"
- "Jr Devo"
- "Composite"
- "HS"
- "Devo"
