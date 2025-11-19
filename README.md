# MTB Race Results Parser

A browser-based PDF parser for extracting Utah High School Mountain Bike race results into CSV format.

## 🚴 Features

- **PDF Text Extraction**: Uses PDF.js to extract race results from PDF documents
- **Smart Parsing**: Handles multi-word names, team name variations, and special cases
- **Time Conversion**: Converts HH:MM:SS.FF format to MM:SS.FF
- **Team Name Cleaning**: Automatically removes "High School", "HS", "Jr Devo", etc.
- **DNF Handling**: Properly processes Did Not Finish entries with Points fields
- **CSV Export**: Download results as CSV for further analysis
- **Preview Mode**: Quick preview of first page before processing full document

## 🚀 Live Demo

[View Live Application](https://your-app-name.netlify.app)

## 📋 Usage

1. **Upload PDF**: Click or drag-and-drop your race results PDF
2. **Preview**: Instantly see parsed results from the first page
3. **Process Full Document**: Click to parse all pages (optional)
4. **Download CSV**: Export results as CSV file

## 📊 Output Format

The parser generates CSV files with the following columns:

- Year
- Region
- Location
- Race Category
- Placement
- Plate# (race number)
- Name
- Team
- Points
- LAP1, LAP2, LAP3, LAP4 (lap times)
- Penalty
- Total Time

## 🔧 Technical Details

### Parsing Logic

- **Name Detection**: Assumes 2-word names (First Last)
- **Points Field**: Extracts 3-digit point values or leaves blank
- **Time Format**: Converts hours to minutes (e.g., 1:03:54.22 → 63:54.22)
- **Team Cleaning**: Removes common suffixes from team names
- **DNF Entries**: Special handling for Did Not Finish entries

### Supported Formats

- Utah HS MTB race result PDFs
- Standard format: `PLC NO NAME TEAM PTS LAP1 LAP2 LAP3 LAP4 PEN TIME`
- Categories: Freshman, Sophomore, JV, Varsity, SLR, Beginner, Intermediate, Advanced

## 🛠️ Development

### Local Development

Simply open `index.html` in a web browser. No build process required!

### Technologies Used

- React 18 (via CDN)
- PDF.js 3.11.174
- Babel Standalone (for JSX transformation)
- Pure HTML/CSS/JavaScript

## 📝 Known Edge Cases

The parser handles:

- Multi-word names and team names
- Variable lap counts (1-4 laps per race)
- DNF entries with or without Points
- Categories spanning multiple pages
- Incomplete races (xx:xx.xx times)
- Penalty time extraction

## 🐛 Troubleshooting

**Excel Time Formatting Issue**: When opening CSV in Excel, times may appear incorrectly formatted (e.g., 30:30:00 instead of 30:30). 

**Solution**: Use Excel's Data Import Wizard (Data → Get Data → From Text/CSV) and set time columns as TEXT format.

**Alternative**: Open CSV in Google Sheets or any text editor to see correct values.

## 📄 License

MIT License - feel free to use and modify for your needs.

## 🤝 Contributing

Issues and pull requests welcome! Please include sample PDFs (with sensitive data removed) when reporting parsing issues.

## 📧 Contact

For questions or issues, please open a GitHub issue.

---

**Version**: 2.0 (Fixed)  
**Last Updated**: November 2025
