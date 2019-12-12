from threading import Lock
import logging
import plotly.figure_factory as ff
import plotly.graph_objs as go
from pygeodesy.ellipsoidalVincenty import LatLon
from rti_python.Ensemble.Ensemble import Ensemble


class ShipTrackVM:

    def __init__(self):
        self.lat = []
        self.lon = []
        self.avg_mag = []
        self.avg_dir = []
        self.quiver = []                                # Contains arrays with 2 points for quiver
        self.fig = None                                 # Plotly figured generated for quiver plot
        self.mag_scale = 0.1                            # Scale the magnitude line
        self.thread_lock = Lock()

    def set_ens(self, ens: Ensemble):
        """
        Get the data out of the ensemble and populate
        the structure.

        Lock and unlock when getting the data to ensure
        when new data is received, it is not being used with
        old data.
        :param ens: Latest ensemble.
        :return:
        """
        # Lock the object
        self.thread_lock.acquire()

        # Set Data
        if ens.IsNmeaData and ens.NmeaData.GPGGA is not None and ens.IsEarthVelocity:

            # Lat and Lon to the arrays
            self.lat.append(ens.NmeaData.latitude)
            self.lon.append(ens.NmeaData.longitude)

            # Get the average velocity and direction for the ensemble
            avg_mag, avg_dir = ens.EarthVelocity.average_mag_dir()
            self.avg_mag.append(avg_mag)
            self.avg_dir.append(avg_dir)

            # Create the magnitude and direction line
            # Use the given Lat/Lon position as the start point
            #position = LatLon(ens.NmeaData.latitude,
            #                 ens.NmeaData.longitude)

            # Calculate the new position, based on the current lat/lon and the avg mag and dir
            # These 2 points will create the quiver that represents the mag and dir for the given
            # latitude point
            #avg_position = position.destination(avg_mag, avg_dir)

            if len(self.lat) > 1:
                # Create the quiver plot to pass to the javascript
                # Quiver plot does not exist in javascript, so generate the points here
                self.fig = ff.create_quiver(self.lat, self.lon, self.avg_mag, self.avg_dir, self.mag_scale)

                # Add the lat/lon line
                ship_track_points = go.Scatter(x=self.lat,
                                               y=self.lon,
                                               mode='lines',
                                               name='shiptrack')
                #self.fig['data'].append(ship_track_points)
                self.fig.add_trace(ship_track_points)

        # Release the lock
        self.thread_lock.release()

    def get_data(self):
        """
        Populate the structure.

        Lock and unlock when getting the data to ensure
        when new data is received, it is not being used with
        old data.
        :return: Structure with all the latest ensemble data
        """

        # Lock the object
        self.thread_lock.acquire()

        if self.fig is not None:
            # Populate the structure
            st_data = {
                "data": self.fig['data'],
            }
        else:
            st_data = {}

        # Release the lock
        self.thread_lock.release()

        logging.info(st_data)

        return st_data

    def reset(self):
        """
        Reset all the values to clear the plot.
        :return:
        """
        self.lat.clear()
        self.lon.clear()
        self.avg_dir.clear()
        self.avg_mag.clear()
        self.fig = None
