# Victorian Electrical Infrastructure Map

## Project Overview

This interactive mapping application was created for Nick's Airtasker project to visualize Victorian electrical infrastructure, including 66kV substations, land parcels, power lines, and roads. The application provides comprehensive filtering and analysis capabilities for identifying suitable sites for Battery Energy Storage Systems (BESS).

## Features

### 🗺️ Interactive Map Interface
- **OpenStreetMap base layer** - No API key required
- **Multiple data layers** - Substations, land parcels, power lines, and roads
- **Responsive design** - Works on desktop and mobile devices
- **Professional UI** - Modern interface with intuitive controls

### 📊 Data Visualization
- **Substation markers** - Red bolt icons showing electrical substation locations
- **Land parcel polygons** - Color-coded by BESS suitability (green = suitable, blue = other)
- **Power line overlays** - Orange lines showing transmission infrastructure
- **Road networks** - Gray lines showing major arterial roads and bypasses

### 🔍 Advanced Filtering
- **Layer visibility controls** - Toggle individual data layers on/off
- **BESS suitability filter** - Show only parcels suitable for battery storage
- **Voltage level filter** - Filter by 22kV, 33kV, 66kV, 132kV, or 275kV
- **DNSP filter** - Filter by Distribution Network Service Provider (AusNet, Powercor, etc.)

### 📈 Information Panels
- **Real-time statistics** - Count of substations, parcels, power lines, and roads
- **Detailed popups** - Click any feature for comprehensive information
- **Interactive legend** - Color-coded reference for all map elements

### 🛠️ Map Controls
- **Fullscreen mode** - Expand to full screen for detailed analysis
- **Reset view** - Return to default Victoria overview
- **Data export** - Download filtered data as JSON for further analysis

## Data Sources

The application loads data from multiple sources:

1. **export.geojson** - Primary data source containing:
   - Substation locations (Point features)
   - Land parcel boundaries (Polygon features)
   - Power line routes (LineString features)
   - Road networks (LineString features)

2. **export.kml** - Additional power line data with detailed attributes
3. **export.gpx** - Road and transportation network data

## How to Use

### Getting Started
1. **Open the application** - Double-click `index.html` to open in your web browser
2. **Wait for data loading** - The application will automatically load all data sources
3. **Explore the interface** - Use the sidebar controls to customize your view

### Layer Controls
- **Substations** - Toggle visibility of electrical substation markers
- **Land Parcels** - Show/hide land parcel boundaries and ownership data
- **Power Lines** - Display transmission and distribution line networks
- **Roads** - Overlay major road networks and arterial routes

### Filtering Data
- **BESS Suitable Only** - Check this box to show only parcels marked as suitable for battery storage
- **Voltage Level** - Select specific voltage levels (22kV, 33kV, 66kV, etc.)
- **DNSP** - Filter by specific Distribution Network Service Provider

### Interactive Features
- **Click any marker/polygon** - View detailed information in popup windows
- **Zoom and pan** - Navigate around Victoria using mouse or touch controls
- **Fullscreen mode** - Click the expand button for immersive analysis
- **Export data** - Download current filtered data for external analysis

## Technical Details

### Technology Stack
- **Leaflet.js** - Open-source mapping library
- **OpenStreetMap** - Free base map tiles
- **Font Awesome** - Icons and visual elements
- **Vanilla JavaScript** - No framework dependencies

### Browser Compatibility
- Chrome, Firefox, Safari, Edge (modern versions)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled

### Performance
- Optimized for large datasets
- Progressive loading of data layers
- Efficient rendering with layer management

## Project Structure

```
nick-map/
├── index.html          # Main application file
├── style.css           # Styling and layout
├── script.js           # Application logic and data processing
├── README.md           # This documentation
├── export.geojson      # Primary geographic data
├── export.kml          # Power line data
└── export.gpx          # Road network data
```

## Deployment Options

### Local Development
- Simply open `index.html` in a web browser
- All data files must be in the same directory

### Web Hosting
- Upload all files to any web server
- Compatible with GitHub Pages, Netlify, Vercel, etc.
- No server-side processing required

### Google Cloud Platform
- Upload to Google Cloud Storage
- Configure for static website hosting
- Use custom domain if needed

## Data Analysis Capabilities

### BESS Site Identification
The application helps identify suitable sites for Battery Energy Storage Systems by:
- Showing proximity to existing substations
- Highlighting parcels with appropriate zoning
- Displaying land ownership information
- Filtering by size and suitability criteria

### Infrastructure Planning
- Visualize the complete electrical network
- Analyze spatial relationships between components
- Identify gaps in coverage or capacity
- Plan new infrastructure development

### Regulatory Compliance
- View DNSP service areas
- Check voltage level distributions
- Analyze network redundancy
- Assess planning and zoning requirements

## Support and Customization

### Adding New Data
- Replace or add to existing GeoJSON files
- Follow the established data structure
- Update filtering options as needed

### Customizing the Interface
- Modify `style.css` for visual changes
- Update `script.js` for functional modifications
- Add new filter options in `index.html`

### Performance Optimization
- For very large datasets, consider data clustering
- Implement progressive loading for better performance
- Use data compression for faster loading

## Contact and Support

This application was developed for Nick's Airtasker project. For technical support or customization requests, please refer to the original project specifications.

---

**Note**: This application processes large geographic datasets and may take a few moments to load completely. The interface will show loading indicators while data is being processed. 