from threading import Lock
import logging
import math
import plotly.figure_factory as ff
import plotly.graph_objs as go
from pygeodesy.ellipsoidalVincenty import LatLon
from rti_python.Ensemble.Ensemble import Ensemble


class ShipTrackVM:

    def __init__(self):
        self.lat = []
        self.lon = []
        #elf.lat_lon_text = []
        self.last_lat = 0.0
        self.last_lon = 0.0
        self.avg_mag = []
        self.avg_dir = []
        self.quiver_x = []                              # Longitude points
        self.quiver_y = []                              # Latitude points
        self.quiver_text = []                           # Text for the quiver
        self.mag_scale = 20.0                            # Scale the magnitude line
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
            #self.lat_lon_text.append("Lat: " + str(round(ens.NmeaData.latitude, 2)) + " Lon: " + str(round(ens.NmeaData.longitude, 2)))

            # Last Lat/Lon to place a marker for end of the path
            self.last_lat = ens.NmeaData.latitude
            self.last_lon = ens.NmeaData.longitude

            # Get the average velocity and direction for the ensemble
            avg_mag, avg_dir = ens.EarthVelocity.average_mag_dir()
            self.avg_mag.append(avg_mag)
            self.avg_dir.append(avg_dir)

            # Create the magnitude and direction line
            # Use the given Lat/Lon position as the start point
            position = LatLon(ens.NmeaData.latitude,
                              ens.NmeaData.longitude)

            # Calculate the new position, based on the current lat/lon and the avg mag and dir
            # These 2 points will create the quiver that represents the mag and dir for the given
            # latitude point
            if not math.isnan(avg_mag) and not math.isnan(avg_dir):
                avg_position = position.destination(avg_mag * self.mag_scale, avg_dir)

                # Add the points to the arrays
                # The start point is the ship track line
                # The end point is the magnitude and angle from the start point on the ship track line
                self.quiver_x.append(position.lon)
                self.quiver_y.append(position.lat)
                self.quiver_x.append(avg_position.lon)
                self.quiver_y.append(avg_position.lat)
                self.quiver_x.append(None)                  # Add a None to breakup the lines for each quiver
                self.quiver_y.append(None)                  # Add a None to breakup the lines for each quiver
                self.quiver_text.append("Mag: " + str(round(avg_mag, 2)) + " Dir: " + str(round(avg_dir, 2)))

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

        if len(self.lat) > 0:
            # Populate the structure
            st_data = {
                "quiver_x": self.quiver_x,
                "quiver_y": self.quiver_y,
                "quiver_text": self.quiver_text,
                "lat": self.lat,
                "lon": self.lon,
                #"lat_lon_text": self.lat_lon_text,
                "last_lat": self.last_lat,
                "last_lon": self.last_lon,
            }
        else:
            st_data = {}

        # Release the lock
        self.thread_lock.release()

        logging.debug(st_data)

        return st_data

    def reset(self):
        """
        Reset all the values to clear the plot.
        :return:
        """
        self.lat.clear()
        self.lon.clear()
        #self.lat_lon_text.clear()
        self.avg_dir.clear()
        self.avg_mag.clear()
        self.last_lat = 0.0
        self.last_lon = 0.0
        self.quiver_x.clear()
        self.quiver_y.clear()
        self.quiver_text.clear()
