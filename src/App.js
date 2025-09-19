import { useState, useEffect } from 'react';
import DisasterMap from './components/Map'; // file named Map.js, component is DisasterMap
import Loader from './components/Loader';
import Header from './components/Header';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('https://eonet.gsfc.nasa.gov/api/v2.1/events?status=open&days=30&limit=200');
        const data = await response.json();
        const formattedEvents = data.events.map(event => ({
          id: event.id,
          title: event.title,
          categories: event.categories,
          sources: event.sources,
          geometry: event.geometries,
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
      {loading ? (
        <Loader />
      ) : (
        <>
          <Header />
          <DisasterMap events={events} />
        </>
      )}
    </div>
  );
}

export default App;
