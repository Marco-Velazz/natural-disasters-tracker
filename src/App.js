import { useState, useEffect } from 'react';
import Map from './components/Map';
import Loader from './components/Loader';
import Header from './components/Header';

function App() {

  // Array to store events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    // Fetch events from NASA EONET API
    const fetchEvents = async () => {
      try {
        const response = await fetch('https://eonet.gsfc.nasa.gov/api/v2.1/events?status=open&days=30&limit=200');
        const data = await response.json();

        // Mapping data
        const formattedEvents = data.events.map(event => ({
          id: event.id,
          title: event.title,
          categories: event.categories,
          sources: event.sources,
          geometry: event.geometries, // contains coordinates and date
          link: event.link
        }));

        console.log('Fetched events:', formattedEvents);

        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div>
      <Header />
      { !loading ?  <Map events={events} /> : <Loader /> }
    </div>
  );
}

export default App;