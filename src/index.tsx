import React from 'react';
import { DataProvider } from './context/DataContext';
import CalendarScreen from './screens/CalendarScreen';

const App: React.FC = () => (
  <DataProvider>
    <CalendarScreen />
  </DataProvider>
);

export default App;
