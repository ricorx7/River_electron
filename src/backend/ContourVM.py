from threading import Lock
import logging
from rti_python.Ensemble.Ensemble import Ensemble


class ContourVM:

    def __init__(self):
        self.NumBins = 0
        self.NumBeams = 4
        self.magData = []   # Array of bins, each entry contains an array holding one row (bin) of data
        self.x_dt = []
        self.y_bin = []
        self.bt_range = []
        self.bt_range_to_bin = []
        self.last_bin_range = []            # Used to no the end of the plotting area for the shaded area
        self.IsUpward = False
        self.MinBinDepth = 0.0
        self.MaxBinDepth = 0.0

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

        # Get the number of beams
        if ens.IsEnsembleData:
            self.NumBeams = ens.EnsembleData.NumBeams

        # Set if Upward or downward
        if ens.IsAncillaryData:
            self.IsUpward = ens.AncillaryData.is_upward_facing()

        # Create the Bin array
        if self.NumBins != ens.EnsembleData.NumBins:
            # Set the number of bins
            self.NumBins = ens.EnsembleData.NumBins

            # Set the new bin data
            for bin_num in range(ens.EnsembleData.NumBins):
                self.y_bin.append(bin_num)                          # Set the bin number to mark the axis
                self.magData.append([])                             # Create an array for each bin

            # Get Min and max bin depth
            self.MinBinDepth = Ensemble.get_bin_depth(ens.AncillaryData.FirstBinRange, ens.AncillaryData.BinSize, 0)
            self.MaxBinDepth = Ensemble.get_bin_depth(ens.AncillaryData.FirstBinRange, ens.AncillaryData.BinSize, ens.EnsembleData.NumBins)

        # Populate the velocity data and date and time
        if ens.IsEarthVelocity:
            for bin_num in range(ens.EnsembleData.NumBins):
                # Get the data
                bin_mag = ens.EarthVelocity.Magnitude[bin_num]

                if Ensemble.is_bad_velocity(bin_mag):
                    # Set it to the array
                    self.magData[bin_num].append(None)      # Bad Velocity
                else:
                    self.magData[bin_num].append(bin_mag)

        # Bottom Track value
        if ens.IsBottomTrack:
            bt_depth = ens.BottomTrack.avg_range()
            if bt_depth == 0.0:
                self.bt_range.append(None)                  # Bad Range
                self.bt_range_to_bin.append(None)
            else:
                self.bt_range.append(bt_depth)

                # Convert the range to a bin number
                range_to_bin = round(bt_depth - ens.AncillaryData.FirstBinRange) / ens.AncillaryData.BinSize
                self.bt_range_to_bin.append(range_to_bin)

        # Last bin range to know the bottom of the plot area for the shaded area
        last_bin_range = ens.AncillaryData.FirstBinRange + (ens.AncillaryData.BinSize * ens.EnsembleData.NumBins)
        self.last_bin_range.append(last_bin_range)

        # Populate the date and time with the latest dt
        self.x_dt.append(ens.EnsembleData.datetime().isoformat())

        # Release the lock
        self.thread_lock.release()

    def get_data(self, contour_type: str):
        """
        Populate the structure.

        Lock and unlock when getting the data to ensure
        when new data is received, it is not being used with
        old data.
        :return: Structure with all the latest ensemble data
        """

        # Lock the object
        self.thread_lock.acquire()

        # Populate the structure
        contour_data = {
            "numBeams": self.NumBeams,
            "numBins": self.NumBins,
            "contourData": self.magData,
            "X_dt": self.x_dt,
            "Y_bin": self.y_bin,
            "btRange": self.bt_range,
            "btRangeToBin": self.bt_range_to_bin,
            "lastBinRange": self.last_bin_range,
            "isUpward": self.IsUpward,
            "minBinDepth": self.MinBinDepth,
            "maxBinDepth": self.MaxBinDepth,
        }

        # Release the lock
        self.thread_lock.release()

        logging.debug(contour_data)

        return contour_data

    def reset(self):
        # Lock the object
        self.thread_lock.acquire()

        self.magData.clear()
        self.x_dt.clear()
        self.y_bin.clear()
        self.bt_range.clear()
        self.bt_range_to_bin.clear()
        self.last_bin_range.clear()
        self.NumBins = 0

        # Release the lock
        self.thread_lock.release()


