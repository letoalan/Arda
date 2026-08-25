export const geoReferenceLines: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Équateur',
        refType: 'equator'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-180, 0],
          [180, 0]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Tropique Nord',
        refType: 'tropic'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-180, 23.5],
          [180, 23.5]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Tropique Sud',
        refType: 'tropic'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-180, -23.5],
          [180, -23.5]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Cercle Polaire Arctique',
        refType: 'polar-circle'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-180, 66.5],
          [180, 66.5]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Cercle Polaire Antarctique',
        refType: 'polar-circle'
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [-180, -66.5],
          [180, -66.5]
        ]
      }
    }
  ]
};
