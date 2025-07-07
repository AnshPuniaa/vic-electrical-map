// Global variables
let map;
let substationCluster, substationLayer, parcelLayer, powerLineLayer, roadLayer;
let allData = {
  substations: [],
  parcels: [],
  powerLines: [],
  roads: []
};

// Initialize the map
function initMap() {
  map = L.map('map').setView([-37.8, 144.9], 7); // Centered on Victoria

  // Add OpenStreetMap base layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Initialize layers
  substationCluster = L.markerClusterGroup();
  substationLayer = L.layerGroup();
  parcelLayer = L.layerGroup();
  powerLineLayer = L.layerGroup();
  roadLayer = L.layerGroup();

  map.addLayer(substationCluster);
  map.addLayer(substationLayer);
  map.addLayer(parcelLayer);
  map.addLayer(powerLineLayer);
  map.addLayer(roadLayer);

  // Only show parcels and lines when zoomed in
  map.on('zoomend', () => {
    renderParcels();
    renderPowerLines();
    renderRoads();
  });
}

// Custom icons
function createSubstationIcon() {
  return L.divIcon({
    className: 'substation-marker',
    html: '<i class="fas fa-bolt" style="color: white; font-size: 12px; line-height: 20px; text-align: center; display: block;"></i>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

// Load and process GeoJSON data
async function loadGeoJSONData() {
  try {
    const response = await fetch('export.geojson');
    const data = await response.json();
    console.log('Total features in export.geojson:', data.features.length);
    let powerLineCount = 0;
    // Process features by type
    data.features.forEach(feature => {
      if (feature.geometry.type === 'Point') {
        allData.substations.push(feature);
      } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
        // Power lines or roads
        if (
          (feature.properties.power && feature.properties.power === 'line') ||
          (feature.properties.voltage && !isNaN(parseInt(feature.properties.voltage)))
        ) {
          allData.powerLines.push(feature);
          powerLineCount++;
        } else {
          allData.roads.push(feature);
        }
      } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        allData.parcels.push(feature);
      }
    });
    console.log('Detected power lines:', powerLineCount);
    allData.powerLines.slice(0, 5).forEach((line, i) => {
      console.log('Sample power line', i, line.properties, line.geometry.type, line.geometry.coordinates);
    });
    if (powerLineCount === 0) {
      alert('No power lines found in export.geojson!');
    }
    // Render all layers
    renderAllLayers();
    updateMapStats();
  } catch (error) {
    console.error('Error loading GeoJSON data:', error);
    document.getElementById('mapStats').innerHTML = '<p style="color: red;">Error loading data</p>';
  }
}

// Load KML data (power lines)
async function loadKMLData() {
  try {
    const response = await fetch('export.kml');
    const kmlText = await response.text();
    
    // Simple KML parsing for power lines
    const parser = new DOMParser();
    const kmlDoc = parser.parseFromString(kmlText, 'text/xml');
    const placemarks = kmlDoc.getElementsByTagName('Placemark');
    
    for (let placemark of placemarks) {
      const name = placemark.getElementsByTagName('name')[0]?.textContent || '';
      const coordinates = placemark.getElementsByTagName('coordinates')[0]?.textContent;
      
      if (coordinates && (name.includes('kV') || name.includes('power'))) {
        const coords = coordinates.trim().split(' ').map(coord => {
          const [lon, lat] = coord.split(',').map(Number);
          return [lat, lon];
        });
        
        if (coords.length > 1) {
          allData.powerLines.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coords
            },
            properties: {
              name: name,
              type: 'power_line'
            }
          });
        }
      }
    }
    
    console.log(`Loaded ${allData.powerLines.length} power lines from KML`);
    renderPowerLines();
    
  } catch (error) {
    console.error('Error loading KML data:', error);
  }
}

// Load GPX data (roads)
async function loadGPXData() {
  try {
    const response = await fetch('export.gpx');
    const gpxText = await response.text();
    
    // Simple GPX parsing for roads
    const parser = new DOMParser();
    const gpxDoc = parser.parseFromString(gpxText, 'text/xml');
    const tracks = gpxDoc.getElementsByTagName('trk');
    
    for (let track of tracks) {
      const name = track.getElementsByTagName('name')[0]?.textContent || '';
      const trackSegments = track.getElementsByTagName('trkseg');
      
      for (let segment of trackSegments) {
        const trackPoints = segment.getElementsByTagName('trkpt');
        const coords = [];
        
        for (let point of trackPoints) {
          const lat = parseFloat(point.getAttribute('lat'));
          const lon = parseFloat(point.getAttribute('lon'));
          coords.push([lat, lon]);
        }
        
        if (coords.length > 1) {
          allData.roads.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coords
            },
            properties: {
              name: name,
              type: 'road'
            }
          });
        }
      }
    }
    
    console.log(`Loaded ${allData.roads.length} roads from GPX`);
    renderRoads();
    
  } catch (error) {
    console.error('Error loading GPX data:', error);
  }
}

// Load extra power lines
async function loadExtraPowerLines() {
  try {
    const response = await fetch('export_powerlines.geojson');
    if (!response.ok) return;
    const data = await response.json();
    if (data.features && Array.isArray(data.features)) {
      allData.powerLines = allData.powerLines.concat(data.features);
      console.log('Loaded extra power lines:', data.features.length);
    }
  } catch (e) {
    console.log('No extra power lines loaded.');
  }
}

// Render substations
function renderSubstations() {
  substationCluster.clearLayers();
  substationLayer.clearLayers();
  
  const filteredSubstations = allData.substations.filter(sub => {
    const props = sub.properties;
    const voltageFilter = document.getElementById('voltageFilter').value;
    const dnspFilter = document.getElementById('dnspFilter').value;
    
    if (voltageFilter !== 'all' && props.name && !props.name.includes(voltageFilter)) return false;
    if (dnspFilter !== 'all' && props.DNSP && props.DNSP !== dnspFilter) return false;
    
    return true;
  });
  
  filteredSubstations.forEach(sub => {
    const coords = sub.geometry.coordinates;
    const marker = L.marker([coords[1], coords[0]], { icon: createSubstationIcon() });
    
    const popup = createSubstationPopup(sub);
    marker.bindPopup(popup);
    
    substationCluster.addLayer(marker);
  });
}

// Render land parcels
function renderParcels() {
  parcelLayer.clearLayers();
  if (map.getZoom() < 12) return; // Only show when zoomed in
  
  const bessFilter = document.getElementById('bessFilter').checked;
  let filteredParcels = allData.parcels;
  
  if (bessFilter) {
    filteredParcels = allData.parcels.filter(p => p.properties.BESS_candidate === 'Yes');
  }
  
  filteredParcels.forEach(parcel => {
    const style = getParcelStyle(parcel);
    const layer = L.geoJSON(parcel, {
      style: style,
      onEachFeature: (feature, layer) => {
        const popup = createParcelPopup(feature);
        layer.bindPopup(popup);
      }
    });
    
    parcelLayer.addLayer(layer);
  });
}

// Render power lines
function renderPowerLines() {
  powerLineLayer.clearLayers();
  if (map.getZoom() < 12) return; // Only show when zoomed in
  if (!allData.powerLines || allData.powerLines.length === 0) {
    console.log('No power lines found in data.');
    return;
  }
  console.log('Rendering power lines:', allData.powerLines.length);
  allData.powerLines.slice(0, 3).forEach((line, i) => {
    console.log('Sample power line', i, line.geometry.type, line.geometry.coordinates);
  });
  allData.powerLines.forEach(line => {
    let polylines = [];
    if (line.geometry.type === 'LineString') {
      polylines = [line.geometry.coordinates.map(coord => [coord[1], coord[0]])];
    } else if (line.geometry.type === 'MultiLineString') {
      polylines = line.geometry.coordinates.map(segment => segment.map(coord => [coord[1], coord[0]]));
    }
    polylines.forEach(coords => {
      const polyline = L.polyline(coords, {
        color: '#39ff14', // neon green
        weight: 12,
        opacity: 1,
        className: 'power-line'
      });
      const popup = createPowerLinePopup(line);
      polyline.bindPopup(popup);
      powerLineLayer.addLayer(polyline);
    });
  });
}

// Render roads
function renderRoads() {
  roadLayer.clearLayers();
  if (map.getZoom() < 12) return; // Only show when zoomed in
  
  allData.roads.forEach(road => {
    const coords = road.geometry.coordinates.map(coord => [coord[1], coord[0]]);
    const polyline = L.polyline(coords, {
      color: '#34495e',
      weight: 2,
      opacity: 0.6
    });
    
    const popup = createRoadPopup(road);
    polyline.bindPopup(popup);
    
    roadLayer.addLayer(polyline);
  });
}

// Render all layers
function renderAllLayers() {
  renderSubstations();
  renderParcels();
  renderPowerLines();
  renderRoads();
}

// Style functions
function getParcelStyle(feature) {
  const isBESS = feature.properties.BESS_candidate === 'Yes';
  return {
    color: isBESS ? '#28a745' : '#0074D9',
    weight: 2,
    fillOpacity: isBESS ? 0.5 : 0.2
  };
}

// Popup creation functions
function createSubstationPopup(feature) {
  const props = feature.properties;
  console.log('Substation properties:', props);
  // Name
  let nameText = props.name || 'Substation';
  // Voltage (convert from volts to kV if present)
  let voltageText = '';
  if (props.voltage) {
    let v = parseInt(props.voltage, 10);
    if (!isNaN(v)) voltageText = (v >= 1000 ? (v / 1000) + ' kV' : v + ' V');
  }
  // Coordinates
  let coordsText = '';
  if (props.lat && props.lon) {
    coordsText = `${props.lat}, ${props.lon}`;
  } else if (feature.geometry && feature.geometry.coordinates) {
    coordsText = feature.geometry.coordinates.slice().reverse().join(', ');
  }
  // DNSP and Score (only if present)
  let dnspsText = props.DNSP ? `<p><b>DNSP:</b> ${props.DNSP}</p>` : '';
  let scoreText = props.score || props.Score ? `<p><b>Score:</b> ${props.score || props.Score}</p>` : '';
  return `
    <div class="popup-content">
      <h4><i class="fas fa-bolt"></i> ${nameText}</h4>
      <p><b>Location:</b> ${coordsText}</p>
      ${voltageText ? `<p><b>Voltage:</b> ${voltageText}</p>` : ''}
      ${dnspsText}
      ${scoreText}
    </div>
  `;
}

function createParcelPopup(feature) {
  const props = feature.properties;
  return `
    <div class="popup-content">
      <h4><i class="fas fa-draw-polygon"></i> Land Parcel</h4>
      <p><b>Parcel ID:</b> ${props.parcel_id || 'N/A'}</p>
      <p><b>Substation:</b> ${props.substation_name || 'N/A'}</p>
      <p><b>DNSP:</b> ${props.DNSP || 'N/A'}</p>
      <p><b>Town:</b> ${props.town || 'N/A'}</p>
      <p><b>Owner Type:</b> ${props.owner_type || 'N/A'}</p>
      <p><b>Manager:</b> ${props.manager || 'N/A'}</p>
      <p><b>Zoning:</b> ${props.zone || 'N/A'}</p>
      <p><b>Area:</b> ${props.area_sqm ? `${props.area_sqm} m²` : 'N/A'}</p>
      <p><b>BESS Suitable:</b> ${props.BESS_candidate || 'N/A'}</p>
    </div>
  `;
}

function createPowerLinePopup(feature) {
  const props = feature.properties;
  // Voltage (convert from volts to kV if present)
  let voltageText = '';
  if (props.voltage) {
    let v = parseInt(props.voltage, 10);
    if (!isNaN(v)) voltageText = (v >= 1000 ? (v / 1000) + ' kV' : v + ' V');
  }
  return `
    <div class="popup-content">
      <h4><i class="fas fa-bolt"></i> Power Line</h4>
      ${props['@id'] ? `<p><b>ID:</b> ${props['@id']}</p>` : ''}
      ${voltageText ? `<p><b>Voltage:</b> ${voltageText}</p>` : ''}
      ${props.cables ? `<p><b>Cables:</b> ${props.cables}</p>` : ''}
      ${props.circuits ? `<p><b>Circuits:</b> ${props.circuits}</p>` : ''}
      ${props.wires ? `<p><b>Wires:</b> ${props.wires}</p>` : ''}
      ${props.source ? `<p><b>Source:</b> ${props.source}</p>` : ''}
      ${props.name ? `<p><b>Name:</b> ${props.name}</p>` : ''}
      ${props.type ? `<p><b>Type:</b> ${props.type}</p>` : ''}
      ${props.power ? `<p><b>Power:</b> ${props.power}</p>` : ''}
    </div>
  `;
}

function createRoadPopup(feature) {
  const props = feature.properties;
  return `
    <div class="popup-content">
      <h4><i class="fas fa-road"></i> Road</h4>
      <p><b>Name:</b> ${props.name || 'N/A'}</p>
      <p><b>Type:</b> ${props.type || 'Road'}</p>
    </div>
  `;
}

// Update map statistics
function updateMapStats() {
  const stats = document.getElementById('mapStats');
  const bessParcels = allData.parcels.filter(p => p.properties.BESS_candidate === 'Yes').length;
  
  stats.innerHTML = `
    <p><b>Substations:</b> ${allData.substations.length}</p>
    <p><b>Land Parcels:</b> ${allData.parcels.length}</p>
    <p><b>BESS Suitable:</b> ${bessParcels}</p>
    <p><b>Power Lines:</b> ${allData.powerLines.length}</p>
    <p><b>Roads:</b> ${allData.roads.length}</p>
  `;
}

// Event listeners
function setupEventListeners() {
  // Layer visibility controls
  document.getElementById('showSubstations').addEventListener('change', function(e) {
    if (e.target.checked) {
      map.addLayer(substationLayer);
    } else {
      map.removeLayer(substationLayer);
    }
  });
  
  document.getElementById('showParcels').addEventListener('change', function(e) {
    if (e.target.checked) {
      map.addLayer(parcelLayer);
    } else {
      map.removeLayer(parcelLayer);
    }
  });
  
  document.getElementById('showPowerLines').addEventListener('change', function(e) {
    if (e.target.checked) {
      map.addLayer(powerLineLayer);
    } else {
      map.removeLayer(powerLineLayer);
    }
  });
  
  document.getElementById('showRoads').addEventListener('change', function(e) {
    if (e.target.checked) {
      map.addLayer(roadLayer);
    } else {
      map.removeLayer(roadLayer);
    }
  });
  
  // Filter controls
  document.getElementById('bessFilter').addEventListener('change', renderParcels);
  document.getElementById('voltageFilter').addEventListener('change', renderSubstations);
  document.getElementById('dnspFilter').addEventListener('change', renderSubstations);
  
  // Map control buttons
  document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
  document.getElementById('resetViewBtn').addEventListener('click', resetView);
  document.getElementById('exportBtn').addEventListener('click', exportData);
}

// Map control functions
function toggleFullscreen() {
  const elem = document.documentElement;
  if (!document.fullscreenElement) {
    elem.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function resetView() {
  map.setView([-37.8, 144.9], 7);
  // Flash all visible features for easy identification
  setTimeout(() => {
    document.querySelectorAll('.leaflet-interactive, .substation-marker').forEach(el => {
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 1000);
    });
  }, 400); // Wait for map to finish panning
}

function exportData() {
  const dataToExport = {
    substations: allData.substations,
    parcels: allData.parcels,
    powerLines: allData.powerLines,
    roads: allData.roads
  };
  
  const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'victorian_electrical_infrastructure.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Initialize everything
async function init() {
  initMap();
  setupEventListeners();
  
  // Load all data sources
  await Promise.all([
    loadGeoJSONData(),
    loadKMLData(),
    loadGPXData()
  ]);
  
  await loadExtraPowerLines();
  renderAllLayers();
  updateMapStats();
  console.log('Map initialization complete');
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
  init();
  // Zoom to Power Line button handler (works for both HTML and dynamic button)
  let zoomBtn = document.getElementById('zoomPowerLineBtn');
  if (!zoomBtn) {
    zoomBtn = document.createElement('button');
    zoomBtn.textContent = 'Zoom to Power Line';
    zoomBtn.style.position = 'absolute';
    zoomBtn.style.top = '60px';
    zoomBtn.style.right = '10px';
    zoomBtn.style.zIndex = 2000;
    zoomBtn.style.background = '#39ff14';
    zoomBtn.style.color = '#222';
    zoomBtn.style.fontWeight = 'bold';
    zoomBtn.style.border = '2px solid #222';
    zoomBtn.style.borderRadius = '6px';
    zoomBtn.style.padding = '8px 12px';
    zoomBtn.style.cursor = 'pointer';
    zoomBtn.id = 'zoomPowerLineBtn';
    document.body.appendChild(zoomBtn);
  }
  zoomBtn.onclick = function() {
    if (allData.powerLines && allData.powerLines.length > 0) {
      let line = allData.powerLines[0];
      let coords = line.geometry.type === 'LineString' ? line.geometry.coordinates : line.geometry.coordinates[0];
      let mid = Math.floor(coords.length / 2);
      let center = coords[mid];
      map.setView([center[1], center[0]], 14);
    } else {
      alert('No power lines found in data.');
    }
  };

  // Minimize/restore legend
  const legendBox = document.getElementById('legendBox');
  const minimizeBtn = document.getElementById('minimizeLegendBtn');
  let minimized = false;
  minimizeBtn.onclick = function() {
    if (!minimized) {
      legendBox.style.height = '36px';
      legendBox.style.overflow = 'hidden';
      legendBox.style.minWidth = '60px';
      minimizeBtn.innerHTML = '<i class="fas fa-plus"></i>';
      minimized = true;
    } else {
      legendBox.style.height = '';
      legendBox.style.overflow = '';
      legendBox.style.minWidth = '';
      minimizeBtn.innerHTML = '<i class="fas fa-minus"></i>';
      minimized = false;
    }
  };
}); 