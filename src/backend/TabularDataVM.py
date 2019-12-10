import datetime
from threading import Lock
import logging
from rti_python.Ensemble.Ensemble import Ensemble


class TabularDataVM():
    """
    Create a ViewModel for the Tabular View.
    This will handle all the data to view on the view in Electron.
    Zerorpc passes the data between the python and nodejs code.
    """

    def __init__(self):
        """
        Initialize the values.
        """
        self.ens_num = 0
        self.latest_ens = None
        self.num_ens = 0
        self.lost_ens = 0
        self.bad_ens = 0.0
        self.percent_bad_bins = 0.0
        self.delta_time = 0.0
        self.good_bins = 0
        self.q_top = 0.0
        self.q_measured = 0.0
        self.q_bottom = 0.0
        self.q_left = 0.0
        self.q_right = 0.0
        self.q_total = 0.0
        self.boat_speed = 0.0
        self.boat_course = 0.0
        self.water_speed = 0.0
        self.water_dir = 0.0
        self.calc_depth = 0.0
        self.river_length = 0.0
        self.distance_made_good = 0.0
        self.course_made_good = 0.0
        self.duration = 0.0

        self.thread_lock = Lock()

    def set_ens(self, ens: Ensemble):

        # Lock the object
        self.thread_lock.acquire()

        # Set the latest ensemble to get the data
        self.latest_ens = ens

        # Increment the number of ensembles
        self.num_ens += 1

        # Release the object
        self.thread_lock.release()

    def get_data(self):
        """
        Retrieve the ensemble data from the view.  The view
        will call the zerorpc to get the latest ensemble data.  The
        latest ensemble data will be passed as a dictionary to the nodejs code.
        The nodejs code will have an interface that describes the same data.

        :param subsystem:  Currently not used, just use 0 for now.
        :return: Ensemble data as a dictionary.
        """
        if self.latest_ens:

            # Lock the object
            self.thread_lock.acquire()

            # Create a dictonary with all the ensemble data
            ens_info = {
                "ensembleNum": self.latest_ens.EnsembleData.EnsembleNumber,
                "ensembleDateTimeStr": self.latest_ens.EnsembleData.datetime().isoformat(),
                "numEnsembles": self.num_ens,
                "lostEnsemble": self.lost_ens,
                "badEnsembles": self.bad_ens,
                "percentBadBins": self.percent_bad_bins,
                "deltaTime": self.delta_time,
                "pitch": self.latest_ens.AncillaryData.Pitch,
                "roll": self.latest_ens.AncillaryData.Roll,
                "heading": self.latest_ens.AncillaryData.Heading,
                "temperature": self.latest_ens.AncillaryData.WaterTemp,
                "pressure": self.latest_ens.AncillaryData.TransducerDepth,
                "goodBins": self.good_bins,
                "topQ": self.q_top,
                "measuredQ": self.q_measured,
                "bottomQ": self.q_bottom,
                "leftQ": self.q_left,
                "rightQ": self.q_right,
                "totalQ": self.q_total,
                "boatSpeed": self.boat_speed,
                "boatCourse": self.boat_course,
                "waterSpeed": self.water_speed ,
                "waterDir": self.water_dir,
                "calcDepth": self.calc_depth,
                "riverLength": self.river_length,
                "distanceMadeGood": self.distance_made_good,
                "courseMadeGood": self.course_made_good,
                "duration": self.duration,
            }

            logging.info(ens_info)

            # Release the object
            self.thread_lock.release()

            return ens_info
        else:
            return None

    def reset(self):
        """
        Reset the values.
        :return:
        """
        # Lock the object
        self.thread_lock.acquire()

        self.num_ens = 0
        self.lost_ens = 0
        self.bad_ens = 0
        self.percent_bad_bins = 0.0
        self.delta_time = 0.0
        self.good_bins = 0
        self.q_top = 0.0
        self.q_measured = 0.0
        self.q_bottom = 0.0
        self.q_left = 0.0
        self.q_right = 0.0
        self.q_total = 0.0
        self.boat_speed = 0.0
        self.boat_course = 0.0
        self.water_speed = 0.0
        self.water_dir = 0.0
        self.calc_depth = 0.0
        self.river_length = 0.0
        self.distance_made_good = 0.0
        self.course_made_good = 0.0
        self.duration = 0.0

        # Release the object
        self.thread_lock.release()
