# Energy Grid Visualization 

This is work in progress

Big idea : do something like https://openinframap.org/, but lightweight if we can

Approach:
- Get data from OpenStreetMap (.osm.pbf)
- Filter that data with osmium to only keep relevant parts (power data, substations, lines, ...)
- Convert to geojson
- Further filtering in Python
- In Vue, import the geojson and load it using MapLibre

TODO:
- Further refine data from OSM, make sure we know what to keep and what to ditch
- Improve data refactoring, e.g convert substations to a single point, simplify
- Nice color scheme, legend, and map icons
- Highlighting lines and points (e.g to show congestion or outage)
- Flow visualization (with arrows ? animations ?)
- Tooltips