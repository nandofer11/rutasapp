// src/App.jsx

import React from 'react';
import MapComponent from './components/MapComponent';

const App = () => {
  return (
    <div className='container py-4'>
      <div className='bg-primary text-white py-2 rounded-4'>
        <h1 className='text-center my-2'>Optimizar rutas - Entrega de Paquetes</h1>
        {/* <div className='text-center'><strong>Integrantes: </strong>Fernández Alva, Orlando | Bernuy Julca, Luis Angel | xxxx | xxxx | xxxx</div> */}
      </div>
      <MapComponent />
    </div>
  );
};

export default App;
