# brew install osmium-tool

osmium tags-filter scotland-260417.osm.pbf \
  nw/power=substation \
  r/route=power \
  -O -o scotland-power.osm.pbf
  
osmium export scotland-power.osm.pbf -O -o scotland-power.geojson