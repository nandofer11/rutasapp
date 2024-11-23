
import React, { useState, useRef } from 'react';
import { createRoot } from "react-dom/client";

import { APIProvider, Map, MapCameraChangedEvent, Marker } from '@vis.gl/react-google-maps';

import axios from 'axios';


const App = () => {
    const [transport, setTransport] = useState('a pie');
    const [addresses, setAddresses] = useState(Array(5).fill(''));
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

    // Estado para los marcadores
    const [markers, setMarkers] = useState<{ lat: number; lng: number; title: string }[]>([]);

    // Refs para los campos de dirección
    const autocompleteRefs = useRef<(google.maps.places.Autocomplete | null)[]>(Array(5).fill(null));

    // Manejo de cambio en direcciones
    const handleAddressChange = (index: number, value: string) => {
        const newAddresses = [...addresses];
        newAddresses[index] = value;
        setAddresses(newAddresses);
    };

    // Punto de partida
    const handleLocate = async () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setCoordinates({ lat: latitude, lng: longitude });

                    try {
                        const response = await axios.get(
                            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=TU_API_KEY`
                        );

                        if (response.data.results.length > 0) {
                            const formattedAddress = response.data.results[0].formatted_address;

                            const newAddresses = [...addresses];
                            newAddresses[0] = formattedAddress;
                            setAddresses(newAddresses);

                            // Establecer marcador del punto de partida
                            setMarkers((prev) => [
                                ...prev.filter((m) => m.title !== 'Punto de partida'),
                                { lat: latitude, lng: longitude, title: 'Punto de partida' },
                            ]);
                        }
                    } catch (error) {
                        console.error('Error al usar Geocoding API:', error);
                    }
                },
                (error) => console.error('Error al obtener la ubicación:', error),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        } else {
            console.error('Geolocalización no soportada.');
        }
    };

    // Agregar marcador de dirección
    const handleAddMarker = (index: number) => {
        const autocomplete = autocompleteRefs.current[index];
        if (autocomplete) {
            const place = autocomplete.getPlace();
            if (place?.geometry?.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const title = `Dirección ${index + 1}`;
                setMarkers((prev) => [
                    ...prev.filter((m) => m.title !== title), // Elimina marcadores previos de la misma dirección
                    { lat, lng, title },
                ]);
            }
        }
    };

    return (
        <APIProvider apiKey={'AIzaSyBeZTi724j11k9obSq7XUQVJlVQE-9jGnA'} onLoad={() => console.log('Maps API has loaded.')}>
            <div className="container">
                <h1 className="text-center my-2">Optimización de rutas</h1>
                <div className="d-flex gap-2">
                    <div className="card">
                        <h4 className="card-title text-center">Ingresa direcciones</h4>
                        <div className="card-body">
                            <div className="">
                                <form>
                                    <div className="form-group">

                                        <div className="d-flex gap-4">
                                            <label>Seleccione Transporte:</label>
                                            <div className="form-check">
                                                <input
                                                    type="radio"
                                                    className="form-check-input"
                                                    id="walking"
                                                    name="transport"
                                                    value="a pie"
                                                    checked={transport === 'a pie'}
                                                    onChange={() => setTransport('a pie')}
                                                />
                                                <label className="form-check-label" htmlFor="walking">A pie</label>
                                            </div>
                                            <div className="form-check">
                                                <input
                                                    type="radio"
                                                    className="form-check-input"
                                                    id="motorcycle"
                                                    name="transport"
                                                    value="moto"
                                                    checked={transport === 'moto'}
                                                    onChange={() => setTransport('moto')}
                                                />
                                                <label className="form-check-label" htmlFor="motorcycle">Moto</label>
                                            </div>
                                            <div className="form-check">
                                                <input
                                                    type="radio"
                                                    className="form-check-input"
                                                    id="car"
                                                    name="transport"
                                                    value="auto"
                                                    checked={transport === 'auto'}
                                                    onChange={() => setTransport('auto')}
                                                />
                                                <label className="form-check-label" htmlFor="car">Auto</label>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2 align-items-center">
                                            <a className="btn btn-success btn-sm my-2" id="btnPuntoPartida"
                                                onClick={handleLocate}
                                            >Punto de partida</a>
                                            {coordinates ? (
                                                <div className="text-coordenadas">
                                                    Coordenadas: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                                                </div>
                                            ) : (
                                                <div className="text-coordenadas">
                                                    No establecido
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                     {addresses.map((address, index) => (
                                    <div key={index} className="form-group">
                                        <label htmlFor={`address${index}`}>Dirección {index + 1}:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id={`address${index}`}
                                            value={address}
                                            placeholder={`Ingrese dirección ${index + 1}`}
                                            onChange={(e) => handleAddressChange(index, e.target.value)}
                                            ref={(input) => {
                                                if (input && !autocompleteRefs.current[index]) {
                                                    autocompleteRefs.current[index] = new google.maps.places.Autocomplete(input);
                                                    autocompleteRefs.current[index]?.addListener('place_changed', () =>
                                                        handleAddMarker(index)
                                                    );
                                                }
                                            }}
                                        />
                                    </div>
                                ))}
                                    <button type="submit" className="btn btn-primary mt-2">Calcular</button>
                                </form>
                            </div>
                            <div className="mt-2">
                                <div className="card">
                                    <div className="card-body">
                                        <p>Aquí irán los gráficos para comparar datos.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="flex-grow-1">

                        {/* <h2>Mapa</h2> */}
                        <div className="card">
                            <div className="card-body" style={{ height: '500px' }}>
                                <Map
                                    defaultZoom={13}
                                    defaultCenter={coordinates || { lat: -8.11636374559279, lng: -79.01696342241479 }}
                                    mapId='2e4a831aeebbdb79'
                                    onCameraChanged={(ev: MapCameraChangedEvent) =>
                                        console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
                                    }>
                                    {/* Marcador para la ubicación actual */}
                                    {coordinates && (
                                        <Marker
                                            position={coordinates}
                                            title="Tu ubicación actual"
                                        />
                                    )}

                                    {/* Marcadores para las direcciones ingresadas */}
                                    {markers.map((marker, index) => (
                                        <Marker
                                            key={index}
                                            position={{ lat: marker.lat, lng: marker.lng }}
                                            title={marker.title}
                                        />
                                    ))}
                                </Map>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </APIProvider>
    );
};

const root = createRoot(document.getElementById('app'));
root.render(<App />);

export default App;