import React from 'react';
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow
} from '@react-google-maps/api';
import { formatRelative } from 'date-fns';

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng
} from 'use-places-autocomplete'

import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption
} from '@reach/combobox'

import '@reach/combobox/styles.css';
import mapFormat from './mapFormat'




const libraries = ['places']

const mapContainerStyle = {
  width: '100vw',
  height: '100vh'

};

const center = {
  lat: 41.014381,
  lng: -74.166191

}

const options = {
  styles: mapFormat,
  disableDefaultUI: true,
  zoomControl: true

}




export default function App() {

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [markers, setMarkers] = React.useState([]);

  const [selected, setSelected] = React.useState(null);


  const onMapClick = React.useCallback((event) => {
    setMarkers((current) => [
      ...current, {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
        time: new Date()
      }
    ])
  }, []);

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map;
  }, [])

  const panTo = React.useCallback(({ lat, lng }) => {
    mapRef.current.panTo({ lat, lng });
    mapRef.current.setZoom(14)

  }, []);

  if (loadError) return 'Error loading maps'
  if (!isLoaded) return 'Loading Maps'


  return (
    <div>
      <h1 className='flip'>
        Safety Tracker
      {' '}
        <span role="img" aria-label="tent">
          ✔
        </span>

      </h1>

      <Search panTo={panTo} />
      <Locate panTo={panTo} />


      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={8}
        center={center}
        options={options}
        onClick={onMapClick}
        onLoad={onMapLoad}
      >
        {markers.map(marker => <Marker
          key={marker.time.toISOString()}
          position={{ lat: marker.lat, lng: marker.lng }}
          icon={{
            url: '/adblock.svg',
            scaledSize: new window.google.maps.Size(30, 30),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(15, 15)

          }}
          onClick={() => {
            setSelected(marker)
            //console.log('hey')
          }}

        />)}

        {selected ? (<InfoWindow position={{ lat: selected.lat, lng: selected.lng }} onCloseClick={() => { setSelected(null) }}>
          <div>
            <h2>
              Suspicious Activity Reported

            </h2>
            <p>Spotted: {formatRelative(selected.time, new Date())} </p>
          </div>
        </InfoWindow>) : null}

      </GoogleMap>

    </div>
  );

}

function Locate({ panTo }) {
  return (
    <button className='locate'
      onClick={() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            panTo({
              lat: position.coords.latitude,
              lng: position.coords.longitude

            })
          },
          () => null
        )
      }}>
      <img src="rancher.svg" alt="compass -locate me" />
    </button>
  )
}

function Search({ panTo }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions
  } = usePlacesAutocomplete({
    requestOptions: {
      location: { lat: () => 41.014381, lng: () => -74.166191 },
      radius: 200 * 1000,
    },
  })

  return (
    < div className='search' >
      <Combobox
        onSelect={async (address) => {
          setValue(address, false)
          clearSuggestions()
          try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            panTo({ lat, lng })
          } catch (error) {
            console.log('Errrror')
          }
        }}
      >



        <ComboboxInput value={value}
          onChange={(e) => {
            setValue(e.target.value)
          }}
          disabled={!ready}
          placeholder='Enter an address' />
        <ComboboxPopover>
          <ComboboxList>
            {status === 'OK' &&
              data.map(({ id, description }) => (
                <ComboboxOption key={id} value={description} />
              ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>

    </div >
  );
}
