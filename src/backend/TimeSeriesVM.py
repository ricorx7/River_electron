from threading import Lock
import logging
import math
from collections import deque
from rti_python.Ensemble.Ensemble import Ensemble
from rti_python.Ensemble.EarthVelocity import EarthVelocity
from rti_python.Utilities.config import RtiConfig

class TimeSeriesVM:

    def __init__(self, rti_config: RtiConfig):

        # RTI Config
        self.rti_config = rti_config
        self.rti_config.init_timeseries_plot_config()

        self.max_ens = self.rti_config.config['TIMESERIES'].getint('MAX_ENS')
        self.is_boat_speed = self.rti_config.config['TIMESERIES'].getboolean('IS_BOAT_SPEED')
        self.boat_speed = deque([], maxlen=self.max_ens)
        self.is_boat_dir = self.rti_config.config['TIMESERIES'].getboolean('IS_BOAT_DIR')
        self.boat_dir = deque([], maxlen=self.max_ens)
        self.is_heading = self.rti_config.config['TIMESERIES'].getboolean('IS_HEADING')
        self.heading = deque([], maxlen=self.max_ens)
        self.is_pitch = self.rti_config.config['TIMESERIES'].getboolean('IS_PITCH')
        self.pitch = deque([], maxlen=self.max_ens)
        self.is_roll = self.rti_config.config['TIMESERIES'].getboolean('IS_ROLL')
        self.roll = deque([], maxlen=self.max_ens)
        self.is_temperature = self.rti_config.config['TIMESERIES'].getboolean('IS_TEMPERATURE')
        self.temperature = deque([], maxlen=self.max_ens)
        self.is_gnss_qual = self.rti_config.config['TIMESERIES'].getboolean('IS_GNSS_QUAL')
        self.gnss_qual = deque([], maxlen=self.max_ens)
        self.is_gnss_hdop = self.rti_config.config['TIMESERIES'].getboolean('IS_GNSS_HDOP')
        self.gnss_hdop = deque([], maxlen=self.max_ens)
        self.is_num_sats = self.rti_config.config['TIMESERIES'].getboolean('IS_NUM_SATS')
        self.num_sats = deque([], maxlen=self.max_ens)
        self.is_water_speed = self.rti_config.config['TIMESERIES'].getboolean('IS_WATER_SPEED')
        self.water_speed = deque([], maxlen=self.max_ens)
        self.is_water_dir = self.rti_config.config['TIMESERIES'].getboolean('IS_WATER_DIR')
        self.water_dir = deque([], maxlen=self.max_ens)
        self.x_dt = deque([], maxlen=self.max_ens)
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

        if ens.IsEnsembleData:
            self.x_dt.append(ens.EnsembleData.datetime().isoformat())
        else:
            self.x_dt.append(None)

        if ens.IsAncillaryData:
            self.heading.append(ens.AncillaryData.Heading)
            self.pitch.append(ens.AncillaryData.Pitch)
            self.roll.append(ens.AncillaryData.Roll)
            self.temperature.append(ens.AncillaryData.WaterTemp)
        else:
            self.heading.append(None)
            self.pitch.append(None)
            self.roll.append(None)
            self.temperature.append(None)

        if ens.IsEarthVelocity:
            avg_mag, avg_dir = ens.EarthVelocity.average_mag_dir()
            self.water_speed.append(avg_mag)
            self.water_dir.append(avg_dir)
        else:
            self.water_speed.append(None)
            self.water_dir.append(None)

        if ens.IsNmeaData:
            self.num_sats.append(ens.NmeaData.GPGGA.num_sats)
            self.gnss_qual.append(ens.NmeaData.GPGGA.gps_qual)
            self.gnss_hdop.append(ens.NmeaData.GPGGA.horizontal_dil)
        else:
            self.num_sats.append(None)
            self.gnss_qual.append(None)
            self.gnss_hdop.append(None)

        if ens.IsBottomTrack:
            # Get the EarthVelocity data
            bt_e0 = ens.BottomTrack.EarthVelocity[0]
            bt_e1 = ens.BottomTrack.EarthVelocity[1]
            bt_e2 = ens.BottomTrack.EarthVelocity[2]

            # Calculate the Magnitude and direction for the bottom track data
            bt_mag = EarthVelocity.calculate_magnitude(bt_e0, bt_e1, bt_e2)
            bt_dir = EarthVelocity.calculate_direction(bt_e0, bt_e1)

            if not Ensemble.is_bad_velocity(bt_mag):
                self.boat_speed.append(bt_mag)
                self.boat_dir.append(bt_dir)
            else:
                # Bad Earth Velocity
                self.boat_speed.append(None)
                self.boat_dir.append(None)
        else:
            # No Bottom Track
            self.boat_speed.append(None)
            self.boat_dir.append(None)

        self.thread_lock.release()

    def set_options(self,
                    is_boat_speed: bool,
                    is_boat_dir: bool,
                    is_heading: bool,
                    is_pitch: bool,
                    is_roll: bool,
                    is_temp: bool,
                    is_gnss_qual: bool,
                    is_gnss_hdop: bool,
                    is_num_sats: bool,
                    is_water_speed: bool,
                    is_water_dir: bool,
                    max_ens: int):
        """
        Set the options for the Time Series.
        :param is_boat_speed: Boat Speed on/off
        :param is_boat_dir: Boat Direciton on/off
        :param is_heading: Heading on/off
        :param is_pitch: Pitch on/off
        :param is_roll: roll on/off
        :param is_temp: temperature on/off
        :param is_gnss_qual: GNSS Quality on/off
        :param is_gnss_hdop: GNSS HDOP on/off
        :param is_num_sats: Number of Sats on/off
        :param is_water_speed: Water Speed on/off
        :param is_water_dir: Water Direction on/off
        :param max_ens: Maximum ensembles to display
        :return:
        """

        # Lock the object
        self.thread_lock.acquire()

        # Write settings to the config
        self.rti_config.config['TIMESERIES']['IS_BOAT_SPEED'] = RtiConfig.bool_to_str(is_boat_speed)
        self.rti_config.config['TIMESERIES']['IS_BOAT_DIR'] = RtiConfig.bool_to_str(is_boat_dir)
        self.rti_config.config['TIMESERIES']['IS_HEADING'] = RtiConfig.bool_to_str(is_heading)
        self.rti_config.config['TIMESERIES']['IS_PITCH'] = RtiConfig.bool_to_str(is_pitch)
        self.rti_config.config['TIMESERIES']['IS_ROLL'] = RtiConfig.bool_to_str(is_roll)
        self.rti_config.config['TIMESERIES']['IS_TEMPERATURE'] = RtiConfig.bool_to_str(is_temp)
        self.rti_config.config['TIMESERIES']['IS_GNSS_QUAL'] = RtiConfig.bool_to_str(is_gnss_qual)
        self.rti_config.config['TIMESERIES']['IS_GNSS_HDOP'] = RtiConfig.bool_to_str(is_gnss_hdop)
        self.rti_config.config['TIMESERIES']['IS_NUM_SATS'] = RtiConfig.bool_to_str(is_num_sats)
        self.rti_config.config['TIMESERIES']['IS_WATER_SPEED'] = RtiConfig.bool_to_str(is_water_speed)
        self.rti_config.config['TIMESERIES']['IS_WATER_DIR'] = RtiConfig.bool_to_str(is_water_dir)
        self.rti_config.config['TIMESERIES']['MAX_ENS'] = str(max_ens)
        self.rti_config.write()

        # Set the options
        self.is_boat_speed = is_boat_speed
        self.is_boat_dir = is_boat_dir
        self.is_heading = is_heading
        self.is_pitch = is_pitch
        self.is_roll = is_roll
        self.is_temperature = is_temp
        self.is_gnss_qual = is_gnss_qual
        self.is_gnss_hdop = is_gnss_hdop
        self.is_num_sats = is_num_sats
        self.is_water_speed = is_water_speed
        self.is_water_dir = is_water_dir

        # Check if Max Ensembles changed
        # If it changed, then create new deque with new maxlen
        if self.max_ens != max_ens:
            self.max_ens = max_ens

            # Create a temp of the values
            boat_speed = list(self.boat_speed)
            boat_dir = list(self.boat_dir)
            heading = list(self.heading)
            pitch = list(self.pitch)
            roll = list(self.roll)
            temperature = list(self.temperature)
            gnss_qual = list(self.gnss_qual)
            gnss_hdop = list(self.gnss_hdop)
            num_sats = list(self.num_sats)
            water_speed = list(self.water_speed)
            water_dir = list(self.water_dir)

            # Recreate the deque with the new maxlen and original data
            self.boat_speed = deque(boat_speed, maxlen=self.max_ens)
            self.boat_dir = deque(boat_dir, maxlen=self.max_ens)
            self.heading = deque(heading, maxlen=self.max_ens)
            self.pitch = deque(pitch, maxlen=self.max_ens)
            self.roll = deque(roll, maxlen=self.max_ens)
            self.temperature = deque(temperature, maxlen=self.max_ens)
            self.gnss_qual = deque(gnss_qual, maxlen=self.max_ens)
            self.gnss_hdop = deque(gnss_hdop, maxlen=self.max_ens)
            self.num_sats = deque(num_sats, maxlen=self.max_ens)
            self.water_speed = deque(water_speed, maxlen=max_ens)
            self.water_dir = deque(water_dir, maxlen=max_ens)

        # Release the lock
        self.thread_lock.release()

    def get_options(self):
        """
        Get the options.  Populate the structure.

        Lock and unlock when getting the data to ensure
        when new data is received, it is not being used with
        old data.
        :return: Structure with all the latest options
        """

        # Lock the object
        self.thread_lock.acquire()

        # Populate the structure
        st_data = {
            "isBoatSpeed": self.is_boat_speed,
            "isBoatDir": self.is_boat_dir,
            "isHeading": self.is_heading,
            "isPitch": self.is_pitch,
            "isRoll": self.is_roll,
            "isTemperature": self.is_temperature,
            "isGnssQual": self.is_gnss_qual,
            "isGnssHdop": self.is_gnss_hdop,
            "isNumSat": self.is_num_sats,
            "isWaterSpeed": self.is_water_speed,
            "isWaterDir": self.is_water_dir,
            "maxEns": self.max_ens,
        }

        # Release the lock
        self.thread_lock.release()

        logging.info(st_data)

        return st_data

    def get_data(self):
        """
        Get the options and the data.  Populate the structure.

        Lock and unlock when getting the data to ensure
        when new data is received, it is not being used with
        old data.
        :return: Structure with all the latest data
        """

        # Lock the object
        self.thread_lock.acquire()

        if len(self.x_dt) > 0:
            # Populate the structure
            st_data = {
                "isBoatSpeed": self.is_boat_speed,
                "boatSpeedData": list(self.boat_speed),
                "isBoatDir": self.is_boat_dir,
                "boatDirData": list(self.boat_dir),
                "isHeading": self.is_heading,
                "headingData": list(self.heading),
                "isPitch": self.is_pitch,
                "pitchData": list(self.pitch),
                "isRoll": self.is_roll,
                "rollData": list(self.roll),
                "isTemperature": self.is_temperature,
                "temperatureData": list(self.temperature),
                "isGnssQual": self.is_gnss_qual,
                "gnssQualData": list(self.gnss_qual),
                "isGnssHdop": self.is_gnss_hdop,
                "gnssHdopData": list(self.gnss_hdop),
                "isNumSat": self.is_num_sats,
                "numSatData": list(self.num_sats),
                "isWaterSpeed": self.is_water_speed,
                "waterSpeedData": list(self.water_speed),
                "isWaterDir": self.is_water_dir,
                "waterDirData": list(self.water_dir),
                "X_dt": list(self.x_dt),
                "maxEns": self.max_ens,
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
        self.boat_speed.clear()
        self.boat_dir.clear()
        self.heading.clear()
        self.pitch.clear()
        self.roll.clear()
        self.temperature.clear()
        self.gnss_qual.clear()
        self.gnss_hdop.clear()
        self.num_sats.clear()
        self.water_speed.clear()
        self.water_dir.clear()
