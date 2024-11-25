import React, { useState, useRef } from 'react';
import { GoogleMap, Marker, Autocomplete, LoadScript } from '@react-google-maps/api';
import { Form, Button } from 'react-bootstrap';

const containerStyle = {
  width: '100%',
  height: '100%',
};

const center = {
  lat: -8.116497,
  lng: -79.032132,
};

const libraries = ['places'];

const MapComponent = () => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [originCoordinates, setOriginCoordinates] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);

  const [polylines, setPolylines] = useState([]);

  const [directions, setDirections] = useState(null); // Estado para almacenar las direcciones

  const [sortLabel, setSortLabel] = useState('');

  const [closestAddress, setClosestAddress] = useState(null); // Dirección más cercana


  const [formData, setFormData] = useState({
    urbanization: '',
    quantity: 1,
    packages: [],
  });
  const autocompleteRef = useRef(null);

  // Handle map load
  const handleMapLoad = (map) => {
    setMap(map);
  };

  // Handle setting the starting point
  const handleOriginClick = () => {
  if (map) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMarkers((prev) => [...prev, { lat: latitude, lng: longitude }]);
        setOriginCoordinates({ lat: latitude, lng: longitude });
        map.panTo({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Error al obtener la ubicación:', error);
        alert('No se pudo obtener la ubicación. Verifica los permisos.');
      },
      {
        enableHighAccuracy: true, // Activar alta precisión
        timeout: 10000,          // Tiempo máximo para obtener ubicación
        maximumAge: 0            // No usar caché
      }
    );
  }
};


  // Show or hide the form
  const toggleForm = () => {
    setFormData({
      urbanization: '',
      quantity: 1,
      packages: [],
    });
    setShowForm((prev) => !prev);
  };

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle dynamic input for packages
  const handlePackageChange = (index, value) => {
    const updatedPackages = [...formData.packages];
    updatedPackages[index] = value;
    setFormData((prev) => ({ ...prev, packages: updatedPackages }));
  };

  // Save the delivery
  const saveDelivery = () => {
    const selectedPlace = autocompleteRef.current.getPlace();
    if (!selectedPlace || !selectedPlace.geometry) {
      alert('Selecciona una dirección válida de la lista.');
      return;
    }

    const location = selectedPlace.geometry.location;
    const newMarker = { lat: location.lat(), lng: location.lng() };

    // Update deliveries and markers
    setDeliveries((prev) => [
      ...prev,
      {
        urbanization: selectedPlace.formatted_address,
        packages: formData.packages,
        coordinates: newMarker,
      },
    ]);
    setMarkers((prev) => [...prev, newMarker]);

    // Hide the form
    toggleForm();
  };

  // Render deliveries list
  const renderDeliveries = () => {
    if (deliveries.length === 0) {
      return <p className="text-muted text-center">No hay entregas registradas.</p>;
    }
    return deliveries.map((delivery, index) => (
      <div key={index} className="card mb-2">
        <div className="card-body">
          <strong>Urbanización:</strong> {delivery.urbanization}
          <br />
          <strong>Paquetes:</strong>{' '}
          {delivery.packages.map((pkg, i) => (
            <span key={i} className="badge bg-primary me-1">{`Paquete ${i + 1}: ${pkg}`}</span>
          ))}
        </div>
      </div>
    ));
  };

  // Calculate distance and time
  const calculateDistance = () => {
    if (!originCoordinates || deliveries.length === 0) {
      alert('Establece un punto de partida y al menos una urbanización.');
      return;
    }

    const destinationCoordinates = deliveries.map((delivery) => delivery.coordinates);
    const service = new window.google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [originCoordinates],
        destinations: destinationCoordinates,
        travelMode: 'DRIVING',
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === 'OK') {
          const results = response.rows[0].elements;
          const closestIndex = results.findIndex(
            (r) =>
              r.status === 'OK' &&
              r.distance.value === Math.min(...results.map((res) => res .distance.value))
          );
          const closestUrbanization = deliveries[closestIndex];

          setCalculationResult({
            urbanization: closestUrbanization.urbanization,
            distance: results[closestIndex].distance.text,
            durations: {
              walking: results[closestIndex].duration.text,
              moto: (results[closestIndex].duration.value / 2).toFixed(0) + ' minutos',
              car: results[closestIndex].duration.text,
            },
          });
        } else {
          console.error('Error al calcular la distancia:', status);
          alert('No se pudo calcular la distancia. Intenta nuevamente.');
        }
      }
    );
  };

  // Filter and sort deliveries
  const sortDeliveries = (type) => {
    let sortedDeliveries = [];
    if (type === 'quantity') {
      sortedDeliveries = [...deliveries].sort((a, b) => a.packages.length - b.packages.length);
      setSortLabel('Ordenando por número de paquetes');
    } else if (type === 'weight') {
      sortedDeliveries = [...deliveries].sort(
        (a, b) =>
          a.packages.reduce((sum, w) => sum + parseFloat(w || 0), 0) -
          b.packages.reduce((sum, w) => sum + parseFloat(w || 0), 0)
      );
      setSortLabel('Ordenando por peso total de paquetes');
    }
    setDeliveries(sortedDeliveries);
  };

  // Draw graph with polyline
  const drawRoute = () => {
    if (!originCoordinates || !calculationResult) {
      alert('Debes establecer un punto de partida y calcular la distancia primero.');
      return;
    }

    const closestDelivery = deliveries.find(
      (delivery) => delivery.urbanization === calculationResult.urbanization
    );

    if (!closestDelivery || !closestDelivery.coordinates) {
      alert('No se encontraron coordenadas para la urbanización más cercana.');
      return;
    }

    const closestCoordinates = closestDelivery.coordinates;

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#FF0000',
        strokeOpacity: 0.7,
        strokeWeight: 5,
      },
    });

    directionsRenderer.setMap(map);

    directionsService.route(
      {
        origin: originCoordinates,
        destination: closestCoordinates,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
        } else {
          console.error('No se pudo trazar la ruta:', status);
          alert('No se pudo trazar la ruta: ' + status);
        }
      }
    );
  };

  
  return (
    <LoadScript googleMapsApiKey="AIzaSyBeZTi724j11k9obSq7XUQVJlVQE-9jGnA" libraries={libraries}>
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-4">
            <div className="mb-3">
              <button className="btn btn-primary w-100" onClick={handleOriginClick}>
                Establecer Punto de Partida
              </button>
            </div>
            {originCoordinates ? (
              <p className="text-center card py-2">
                <strong>Coordenadas del Punto de Partida:</strong>
                <br />
                Latitud: {originCoordinates.lat.toFixed(6)}, Longitud: {originCoordinates.lng.toFixed(6)}
              </p>
            ) : (
              <p className="text-center text-danger card">Aún no se ha establecido punto de partida.</p>
            )}
            <div className="mb-3">
              <button className="btn btn-success w-100" onClick={toggleForm}>
                {showForm ? 'Cancelar' : 'Agregar Entrega'}
              </button>
            </div>
            {showForm && (
              <div className="card p-3">
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Urbanización</Form.Label>
                    <Autocomplete
                      onLoad={(ref) => (autocompleteRef.current = ref)}
                      onPlaceChanged={() => {
                        const place = autocompleteRef.current.getPlace();
                        if (place && place.geometry) {
                          handleFormChange('urbanization', place.formatted_address);
                        }
                      }}
                    >
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ingrese la dirección"
                      />
                    </Autocomplete>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Cantidad de Paquetes</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleFormChange('quantity', Number(e.target.value))}
                    />
                  </Form.Group>
                  {Array.from({ length: formData.quantity }).map((_, index) => (
                    <Form.Group key={index} className="mb-2">
                      <Form.Control
                        type="text"
                        placeholder={`Peso del Paquete ${index + 1}`}
                        value={formData.packages[index] || ''}
                        onChange={(e) => handlePackageChange(index, e.target.value)}
                      />
                    </Form.Group>
                  ))}
                  <Button variant="primary" onClick={saveDelivery}>
                    Registrar
                  </Button>
                </Form>
              </div>
            )}
            <div>{renderDeliveries()}</div>

            <div className="mb-3">
              <button className="btn btn-info w-100" onClick={calculateDistance}>
                Calcular Distancia
              </button>
              <button className="btn btn-secondary w-100 my-4" onClick={drawRoute}>
              Dibujar Grafo
            </button>
            </div>
            {calculationResult && (
              <div className="card p-3">
                <h5>Resultados del Cálculo:</h5>
                <p><strong>Urbanización Más Cercana:</strong> {calculationResult.urbanization}</p>
                <p><strong>Distancia:</strong> {calculationResult.distance}</p>
                <p><strong>Duración Caminando:</strong> {calculationResult.durations.walking}</p>
                <p><strong>Duración en Moto:</strong> {calculationResult.durations.moto}</p>
                <p><strong>Duración en Auto:</strong> {calculationResult.durations.car}</p>
              </div>
            )}

            <div className="card mt-3 p-3">
              <h5>Ordenar Entregas:</h5>
              <button
                className="btn btn-outline-primary w-100 mb-2"
                onClick={() => sortDeliveries('quantity')}
              >
                Ordenar por Cantidad de Paquetes
              </button>
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => sortDeliveries('weight')}
              >
                Ordenar por Peso Total
              </button>
            </div>
          </div>


          <div className="col-md-8">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={15}
              onLoad={handleMapLoad}
            >
              {markers.map((marker, index) => (
                <Marker key={index} position={marker} />
              ))}
            </GoogleMap>
          </div>
        </div>
      </div>
    </LoadScript>
  );
};

export default MapComponent;
